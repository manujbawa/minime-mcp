/**
 * Search Result Combiner
 * Handles combining and weighting results from different search strategies
 */

export class SearchResultCombiner {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Combine content and tag search results with weighting
     */
    combine(contentResults, tagResults, weights = {}) {
        const { contentWeight = 0.7, tagWeight = 0.3 } = weights;

        try {
            // Create a map to track all unique memories
            const memoryMap = new Map();

            // Process content results
            contentResults.forEach(result => {
                const id = result.id;
                if (!memoryMap.has(id)) {
                    memoryMap.set(id, {
                        ...result,
                        search_scores: {
                            content: result.search_scores?.content || result.similarity,
                            tags: null,
                            combined: 0
                        }
                    });
                } else {
                    // Update existing entry with content score
                    const existing = memoryMap.get(id);
                    existing.search_scores.content = result.search_scores?.content || result.similarity;
                }
            });

            // Process tag results
            tagResults.forEach(result => {
                const id = result.id;
                if (!memoryMap.has(id)) {
                    memoryMap.set(id, {
                        ...result,
                        search_scores: {
                            content: null,
                            tags: result.search_scores?.tags || result.similarity,
                            combined: 0
                        }
                    });
                } else {
                    // Update existing entry with tag score
                    const existing = memoryMap.get(id);
                    existing.search_scores.tags = result.search_scores?.tags || result.similarity;
                }
            });

            // Calculate combined scores and sort
            const combinedResults = Array.from(memoryMap.values()).map(memory => {
                const contentScore = memory.search_scores.content || 0;
                const tagScore = memory.search_scores.tags || 0;
                
                // Calculate weighted combined score
                let combinedScore = 0;
                let actualContentWeight = contentWeight;
                let actualTagWeight = tagWeight;

                // Adjust weights if one score is missing
                if (contentScore === 0 && tagScore > 0) {
                    combinedScore = tagScore;
                    actualContentWeight = 0;
                    actualTagWeight = 1;
                } else if (tagScore === 0 && contentScore > 0) {
                    combinedScore = contentScore;
                    actualContentWeight = 1;
                    actualTagWeight = 0;
                } else if (contentScore > 0 && tagScore > 0) {
                    combinedScore = (actualContentWeight * contentScore) + (actualTagWeight * tagScore);
                }

                return {
                    ...memory,
                    similarity: combinedScore,
                    search_scores: {
                        content: contentScore,
                        tags: tagScore,
                        combined: combinedScore
                    },
                    search_mode: this._determineSearchMode(contentScore, tagScore),
                    weight_distribution: {
                        content_weight: actualContentWeight,
                        tag_weight: actualTagWeight
                    }
                };
            });

            // Sort by combined score (descending), then by importance, then by recency
            combinedResults.sort((a, b) => {
                if (b.similarity !== a.similarity) {
                    return b.similarity - a.similarity;
                }
                if (b.importance_score !== a.importance_score) {
                    return b.importance_score - a.importance_score;
                }
                return new Date(b.created_at) - new Date(a.created_at);
            });

            this.logger.debug(`Combined ${contentResults.length} content + ${tagResults.length} tag results into ${combinedResults.length} unique results`);

            return combinedResults;

        } catch (error) {
            this.logger.error('Result combination failed:', error);
            throw new Error(`Result combination failed: ${error.message}`);
        }
    }

    /**
     * Merge overlapping results and boost scores for memories that appear in both
     */
    mergeWithBoost(contentResults, tagResults, options = {}) {
        const { 
            contentWeight = 0.7, 
            tagWeight = 0.3, 
            overlapBoost = 0.1,
            maxBoost = 0.95 
        } = options;

        try {
            const memoryMap = new Map();

            // Process all results and track overlaps
            [...contentResults, ...tagResults].forEach(result => {
                const id = result.id;
                const isContentResult = result.search_mode === 'content_only' || result.search_scores?.content > 0;
                const isTagResult = result.search_mode === 'tags_only' || result.search_scores?.tags > 0;

                if (!memoryMap.has(id)) {
                    memoryMap.set(id, {
                        ...result,
                        search_scores: {
                            content: isContentResult ? (result.search_scores?.content || result.similarity) : 0,
                            tags: isTagResult ? (result.search_scores?.tags || result.similarity) : 0,
                            combined: 0
                        },
                        appears_in_both: false
                    });
                } else {
                    // This memory appears in both result sets
                    const existing = memoryMap.get(id);
                    existing.appears_in_both = true;
                    
                    if (isContentResult) {
                        existing.search_scores.content = result.search_scores?.content || result.similarity;
                    }
                    if (isTagResult) {
                        existing.search_scores.tags = result.search_scores?.tags || result.similarity;
                    }
                }
            });

            // Calculate combined scores with overlap boost
            const results = Array.from(memoryMap.values()).map(memory => {
                const contentScore = memory.search_scores.content;
                const tagScore = memory.search_scores.tags;
                
                let combinedScore = (contentWeight * contentScore) + (tagWeight * tagScore);
                
                // Apply overlap boost if memory appears in both result sets
                if (memory.appears_in_both && contentScore > 0 && tagScore > 0) {
                    combinedScore = Math.min(combinedScore + overlapBoost, maxBoost);
                }

                return {
                    ...memory,
                    similarity: combinedScore,
                    search_scores: {
                        ...memory.search_scores,
                        combined: combinedScore,
                        overlap_boosted: memory.appears_in_both
                    }
                };
            });

            // Sort by combined score
            results.sort((a, b) => b.similarity - a.similarity);

            this.logger.debug(`Merged results with ${results.filter(r => r.appears_in_both).length} overlap-boosted entries`);

            return results;

        } catch (error) {
            this.logger.error('Result merging with boost failed:', error);
            throw error;
        }
    }

    /**
     * Normalize scores across different result sets
     */
    normalizeScores(results) {
        if (results.length === 0) return results;

        try {
            // Find min/max scores for normalization
            const contentScores = results.map(r => r.search_scores?.content || 0).filter(s => s > 0);
            const tagScores = results.map(r => r.search_scores?.tags || 0).filter(s => s > 0);

            const contentMin = Math.min(...contentScores);
            const contentMax = Math.max(...contentScores);
            const tagMin = Math.min(...tagScores);
            const tagMax = Math.max(...tagScores);

            // Normalize scores to 0-1 range
            return results.map(result => {
                const contentScore = result.search_scores?.content || 0;
                const tagScore = result.search_scores?.tags || 0;

                const normalizedContent = contentScore > 0 ? 
                    (contentScore - contentMin) / (contentMax - contentMin) : 0;
                const normalizedTag = tagScore > 0 ? 
                    (tagScore - tagMin) / (tagMax - tagMin) : 0;

                return {
                    ...result,
                    search_scores: {
                        ...result.search_scores,
                        content_normalized: normalizedContent,
                        tags_normalized: normalizedTag
                    }
                };
            });

        } catch (error) {
            this.logger.error('Score normalization failed:', error);
            return results; // Return original results if normalization fails
        }
    }

    /**
     * Apply diversity filtering to avoid too many similar results
     */
    diversifyResults(results, options = {}) {
        const { maxSimilarMemoryType = 3, maxSimilarProject = 5 } = options;

        try {
            const typeCount = new Map();
            const projectCount = new Map();
            
            return results.filter(result => {
                const memoryType = result.memory_type;
                const projectName = result.project_name;

                const currentTypeCount = typeCount.get(memoryType) || 0;
                const currentProjectCount = projectCount.get(projectName) || 0;

                if (currentTypeCount >= maxSimilarMemoryType || currentProjectCount >= maxSimilarProject) {
                    return false;
                }

                typeCount.set(memoryType, currentTypeCount + 1);
                projectCount.set(projectName, currentProjectCount + 1);
                return true;
            });

        } catch (error) {
            this.logger.error('Result diversification failed:', error);
            return results;
        }
    }

    /**
     * Determine search mode based on available scores
     */
    _determineSearchMode(contentScore, tagScore) {
        if (contentScore > 0 && tagScore > 0) {
            return 'hybrid';
        } else if (contentScore > 0) {
            return 'content_only';
        } else if (tagScore > 0) {
            return 'tags_only';
        } else {
            return 'unknown';
        }
    }

    /**
     * Get statistics about the combination process
     */
    getCombinationStats(contentResults, tagResults, combinedResults) {
        const overlapping = combinedResults.filter(r => 
            r.search_scores?.content > 0 && r.search_scores?.tags > 0
        ).length;

        return {
            content_only_results: contentResults.length,
            tag_only_results: tagResults.length,
            total_unique_results: combinedResults.length,
            overlapping_results: overlapping,
            content_only_unique: combinedResults.filter(r => 
                r.search_scores?.content > 0 && r.search_scores?.tags === 0
            ).length,
            tag_only_unique: combinedResults.filter(r => 
                r.search_scores?.tags > 0 && r.search_scores?.content === 0
            ).length
        };
    }
} 
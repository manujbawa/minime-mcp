#!/usr/bin/env node

/**
 * Script to clean up duplicate memories in the database
 * Keeps the oldest memory and removes newer duplicates
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

const { Pool } = pg;

// Database configuration
const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'minime_memories',
    user: process.env.POSTGRES_USER || 'minime',
    password: process.env.POSTGRES_PASSWORD || 'minime_password'
});

async function cleanupDuplicates() {
    console.log('Starting duplicate memory cleanup...\n');
    
    try {
        // First, analyze duplicates
        const analysisResult = await pool.query(`
            WITH duplicate_analysis AS (
                SELECT 
                    memory_type,
                    content,
                    project_id,
                    COUNT(*) as duplicate_count,
                    MIN(created_at) as first_created,
                    MAX(created_at) as last_created,
                    array_agg(id ORDER BY created_at) as memory_ids
                FROM memories
                GROUP BY memory_type, content, project_id
                HAVING COUNT(*) > 1
            )
            SELECT 
                memory_type,
                COUNT(*) as duplicate_groups,
                SUM(duplicate_count) as total_memories,
                SUM(duplicate_count - 1) as duplicates_to_remove
            FROM duplicate_analysis
            GROUP BY memory_type
            ORDER BY duplicates_to_remove DESC
        `);
        
        console.log('Duplicate Analysis:');
        console.log('===================');
        analysisResult.rows.forEach(row => {
            console.log(`${row.memory_type}: ${row.duplicates_to_remove} duplicates in ${row.duplicate_groups} groups`);
        });
        
        const totalDuplicates = analysisResult.rows.reduce((sum, row) => sum + parseInt(row.duplicates_to_remove), 0);
        
        if (totalDuplicates === 0) {
            console.log('\nNo duplicates found! Database is clean.');
            return;
        }
        
        console.log(`\nTotal duplicates to remove: ${totalDuplicates}`);
        console.log('\nStarting cleanup (keeping oldest memories)...\n');
        
        // Clean up duplicates - keep the oldest, delete the rest
        const deleteResult = await pool.query(`
            WITH duplicates AS (
                SELECT id, 
                       content,
                       project_id,
                       memory_type,
                       created_at,
                       ROW_NUMBER() OVER (
                           PARTITION BY content, project_id, memory_type 
                           ORDER BY created_at ASC
                       ) as rn
                FROM memories
            ),
            to_delete AS (
                SELECT id, memory_type, content, created_at
                FROM duplicates
                WHERE rn > 1
            )
            DELETE FROM memories
            WHERE id IN (SELECT id FROM to_delete)
            RETURNING id, memory_type, 
                     substring(content, 1, 100) as content_preview,
                     created_at
        `);
        
        console.log(`Successfully deleted ${deleteResult.rowCount} duplicate memories!\n`);
        
        // Show sample of what was deleted
        if (deleteResult.rows.length > 0) {
            console.log('Sample of deleted memories:');
            console.log('==========================');
            deleteResult.rows.slice(0, 5).forEach(row => {
                console.log(`- [${row.memory_type}] ${row.content_preview}...`);
                console.log(`  Created: ${row.created_at}`);
            });
            
            if (deleteResult.rows.length > 5) {
                console.log(`\n... and ${deleteResult.rows.length - 5} more`);
            }
        }
        
        // Verify cleanup
        console.log('\nVerifying cleanup...');
        const verifyResult = await pool.query(`
            SELECT COUNT(*) as remaining_duplicates
            FROM (
                SELECT content, project_id, memory_type, COUNT(*) as cnt
                FROM memories
                GROUP BY content, project_id, memory_type
                HAVING COUNT(*) > 1
            ) duplicates
        `);
        
        const remaining = verifyResult.rows[0].remaining_duplicates;
        if (remaining === '0') {
            console.log('✅ All duplicates successfully removed!');
        } else {
            console.log(`⚠️  ${remaining} duplicate groups still remain`);
        }
        
        // Show final statistics
        const statsResult = await pool.query(`
            SELECT 
                memory_type,
                COUNT(*) as total_count,
                COUNT(DISTINCT content || project_id::text) as unique_count
            FROM memories
            GROUP BY memory_type
            ORDER BY memory_type
        `);
        
        console.log('\nFinal Memory Statistics:');
        console.log('=======================');
        statsResult.rows.forEach(row => {
            console.log(`${row.memory_type}: ${row.total_count} total (${row.unique_count} unique)`);
        });
        
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await pool.end();
    }
}

// Run the cleanup
cleanupDuplicates().catch(console.error);
/**
 * Yearly Leave Allocation Script
 * This script can be run via cron job on January 1st each year
 * 
 * Usage:
 * node backend/scripts/yearly-leave-allocation.js [year]
 * 
 * If year is not provided, it will use current year
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const YearlyLeaveService = require('../src/services/YearlyLeaveService');
const moment = require('moment');

async function main() {
    const year = process.argv[2] ? parseInt(process.argv[2]) : moment().year();
    
    console.log(`\n🚀 Starting yearly leave allocation for year ${year}...\n`);
    
    try {
        // Check if already allocated
        const checkResult = await YearlyLeaveService.checkYearlyAllocation(year);
        
        if (checkResult.is_allocated) {
            console.log(`⚠️  Yearly leaves for ${year} have already been allocated.`);
            console.log(`   Allocated: ${checkResult.allocated}/${checkResult.total_employees} employees\n`);
            process.exit(0);
        }
        
        // Allocate leaves
        const result = await YearlyLeaveService.allocateYearlyLeaves(year);
        
        console.log(`✅ Yearly leave allocation completed for ${year}`);
        console.log(`   Total employees: ${result.total_employees}`);
        console.log(`   Successful: ${result.successful}`);
        console.log(`   Failed: ${result.failed}\n`);
        
        if (result.failed > 0) {
            console.log('❌ Failed allocations:');
            result.results
                .filter(r => !r.success)
                .forEach(r => {
                    console.log(`   - ${r.employee_code} (${r.name}): ${r.error}`);
                });
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error allocating yearly leaves:', error);
        process.exit(1);
    }
}

// Run the script
main();

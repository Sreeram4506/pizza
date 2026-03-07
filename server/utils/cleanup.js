import { MenuCategory } from '../models/MenuCategory.js'
import { MenuItem } from '../models/MenuItem.js'

export const runCleanup = async () => {
    try {
        console.log('[CLEANUP] Starting database maintenance...')

        // 1. Fix "Burgger" typo
        const burggerMatches = await MenuCategory.updateMany(
            { name: /Burgger/i },
            { $set: { name: 'Burger' } }
        )
        if (burggerMatches.modifiedCount > 0) {
            console.log(`[CLEANUP] Fixed ${burggerMatches.modifiedCount} "Burgger" typos in categories.`)
        }

        const itemBurggerMatches = await MenuItem.updateMany(
            { name: /Burgger/i },
            { $set: { name: 'Burger' } }
        )
        if (itemBurggerMatches.modifiedCount > 0) {
            console.log(`[CLEANUP] Fixed ${itemBurggerMatches.modifiedCount} "Burgger" typos in menu items.`)
        }

        // 2. Remove "test" placeholders
        const testCategoryResult = await MenuCategory.deleteMany({
            name: { $in: [/test/i, /test2/i] }
        })
        if (testCategoryResult.deletedCount > 0) {
            console.log(`[CLEANUP] Deleted ${testCategoryResult.deletedCount} test categories.`)
        }

        const testItemResult = await MenuItem.deleteMany({
            $or: [
                { name: { $in: [/test/i, /test2/i] } },
                { description: { $in: [/test/i, /test2/i] } }
            ]
        })
        if (testItemResult.deletedCount > 0) {
            console.log(`[CLEANUP] Deleted ${testItemResult.deletedCount} test menu items.`)
        }

        console.log('[CLEANUP] Maintenance complete.')
    } catch (err) {
        console.error('[CLEANUP] Error during maintenance:', err)
    }
}

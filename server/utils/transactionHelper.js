const mongoose = require("mongoose");

/**
 * Executes a callback within a MongoDB atomic transaction when replica set is active.
 * Gracefully executes sequentially if MongoDB is running standalone without transaction support.
 *
 * @param {Function} callback - Function receiving the mongoose `session` object: async (session) => { ... }
 * @returns {Promise<any>}
 */
const runInTransaction = async (callback) => {
    let session = null;
    try {
        session = await mongoose.startSession();
        let result;
        await session.withTransaction(async () => {
            result = await callback(session);
        });
        return result;
    } catch (error) {
        // If error indicates transactions are not supported (e.g. standalone Mongo without replica set)
        if (
            error.message &&
            (error.message.includes("Transaction numbers are only allowed on a replica set member or mongos") ||
             error.message.includes("Standalone servers do not support transactions"))
        ) {
            console.warn("[Transaction Notice] MongoDB is in standalone mode; executing operation directly without session.");
            return await callback(null);
        }
        throw error;
    } finally {
        if (session) {
            await session.endSession();
        }
    }
};

module.exports = { runInTransaction };

/**
 * BillingHelper - Abstracts billing calculation logic
 * Calculates bill from duration + hourly rate, enforces 1-hour minimum
 */
class BillingHelper {
    /**
     * Calculate total amount based on check-in/check-out times and hourly rate
     * @param {Date} checkInTime
     * @param {Date} checkOutTime
     * @param {Number} hourlyRate
     * @returns {Object} { durationHours, totalAmount }
     */
    static calculate(checkInTime, checkOutTime, hourlyRate) {
        const diffMs = checkOutTime.getTime() - checkInTime.getTime();
        let durationHours = diffMs / (1000 * 60 * 60);

        // Enforce minimum 1-hour charge
        if (durationHours < 1) {
            durationHours = 1;
        } else {
            // Round up to the nearest hour
            durationHours = Math.ceil(durationHours);
        }

        const totalAmount = durationHours * hourlyRate;

        return {
            durationHours,
            totalAmount: Math.round(totalAmount * 100) / 100,
        };
    }
}

module.exports = BillingHelper;

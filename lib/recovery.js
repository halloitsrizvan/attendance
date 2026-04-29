
export const getActiveLeaveDays = (fromDateStr, fromTimeStr, returnedAt, studentClass, offDays) => {
    const start = new Date(`${fromDateStr}T${fromTimeStr}`);
    const end = new Date(returnedAt);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    let count = 0;
    let current = new Date(start);
    current.setHours(0, 0, 0, 0);
    
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);

    while (current <= endDay) {
        const dateStr = current.toISOString().split('T')[0];
        const isOffDay = offDays.some(d => {
            const inRange = d.toDate 
                ? (dateStr >= d.fromDate && dateStr <= d.toDate)
                : (dateStr === d.fromDate);
            
            if (!inRange) return false;
            const isRelevant = d.type === 'global' || d.classes.includes(String(studentClass));
            if (!isRelevant) return false;

            const schoolStart = new Date(`${dateStr}T07:30:00`);
            const schoolEnd = new Date(`${dateStr}T16:00:00`);
            const offStart = new Date(`${d.fromDate}T${d.fromTime || '00:00'}:00`);
            const offEnd = new Date(`${d.toDate || d.fromDate}T${d.toTime || '23:59'}:00`);

            return offStart <= schoolStart && offEnd >= schoolEnd;
        });

        if (current.getDay() !== 5 && !isOffDay) { // Skip Fridays and Off Days
            const dayStart = new Date(current);
            dayStart.setHours(7, 30, 0, 0);
            const dayEnd = new Date(current);
            dayEnd.setHours(16, 0, 0, 0);
            
            const overlapStart = start > dayStart ? start : dayStart;
            const overlapEnd = end < dayEnd ? end : dayEnd;
            
            if (overlapStart < overlapEnd) {
                count++;
            }
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
};

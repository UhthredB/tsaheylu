/**
 * Show current conversion metrics dashboard.
 * Run: npm run metrics
 */
import { initTracking, printMetricsDashboard, getMetrics } from '../tracking/conversions.js';

initTracking();
printMetricsDashboard();

const metrics = getMetrics();
console.log('\nRaw metrics JSON:');
console.log(JSON.stringify(metrics, null, 2));

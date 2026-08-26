import axios from 'axios';

async function runRaceTest() {
  const baseURL = 'http://localhost:4000/api';
  console.log('🏁 Starting Automated Concurrency Race Test...');

  try {
    // 1. Get a random available slot
    const slotRes = await axios.get(`${baseURL}/demo/random-slot`);
    const slot = slotRes.data.data;
    console.log(`🎯 Contested Slot: ${slot.facility.name} on ${new Date(slot.date).toDateString()} (${slot.startTime} - ${slot.endTime})`);

    // 2. Fire 15 concurrent booking requests
    console.log('⚡ Firing 15 concurrent requests via /api/demo/race...');
    const startTime = Date.now();
    const raceRes = await axios.post(`${baseURL}/demo/race`, {
      slotId: slot.id,
      userCount: 15,
    });
    const totalDuration = Date.now() - startTime;

    const data = raceRes.data.data;
    console.log('\n📊 RACE RESULTS:');
    console.log(`- Total Requests Sent: ${data.totalConcurrentRequests}`);
    console.log(`- Total Duration: ${totalDuration} ms`);
    console.log(`- Winner: ${data.winner ? `${data.winner.userName} (Latency: ${data.winner.latencyMs}ms)` : 'None'}`);
    console.log(`- Rejected Requests: ${data.losers.length}`);
    console.log(`- Database Confirmed Bookings: ${data.confirmedBookings}`);
    console.log(`- DB Verification: ${data.dbVerification.message}`);

    if (data.confirmedBookings === 1 && data.losers.length === 14) {
      console.log('\n✅ PASS: Concurrency guarantee held perfectly! Exactly ONE winner recorded without corruption.');
    } else {
      console.error('\n❌ FAIL: Double booking or anomaly detected!');
    }
  } catch (err: any) {
    console.error('❌ Race test encountered error:', err.response?.data || err.message);
  }
}

runRaceTest();

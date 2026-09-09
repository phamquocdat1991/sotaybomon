import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSchedule, scheduleForWeek } from '../app/schedule-data.ts';
const legacy = [{id:'old',day:2,period:1,classId:'c1',room:'A',note:'Bài cũ'}];
test('legacy lessons survive in week 1 without inventing other weeks',()=>{
 const result=normalizeSchedule(legacy);
 assert.equal(result[0].note,'Bài cũ');
 assert.equal(result[0].week,1);
 assert.equal(result[0].completed,false);
 assert.equal(scheduleForWeek(result,2).length,0);
 assert.equal(legacy[0].week,undefined);
});
test('same slot in different weeks remains independent after backup roundtrip',()=>{
 const rows=normalizeSchedule([...legacy,{...legacy[0],id:'new',week:2,completed:true}]);
 const restored=normalizeSchedule(JSON.parse(JSON.stringify(rows)));
 assert.equal(scheduleForWeek(restored,1)[0].completed,false);
 assert.equal(scheduleForWeek(restored,2)[0].completed,true);
 assert.equal(normalizeSchedule(restored).length,2);
});

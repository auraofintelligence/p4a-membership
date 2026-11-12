import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewApplications } from '../src/application-review.mjs';

const url = 'https://private.example.test/api/applications';
const organiser = { role: 'organiser', subject: 'verified-reviewer' };
const database = {
  prepare() { assert.fail('The database must not be accessed for this request.'); },
};

test('review requires a verified organiser identity', async () => {
  for (const identity of [null, { role: 'member', subject: 'member' }, { role: 'organiser' }]) {
    const response = await reviewApplications(new Request(url), database, identity);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
});

test('review changes require the workspace origin', async () => {
  const request = new Request(url, { method: 'POST', headers: { Origin: 'https://other.example.test' } });
  const response = await reviewApplications(request, database, organiser);
  assert.equal(response.status, 403);
});

test('review register reports missing storage clearly', async () => {
  const response = await reviewApplications(new Request(url), undefined, organiser);
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /awaiting setup/);
});

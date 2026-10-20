import tempfile
import unittest
from pathlib import Path

from role_sync_schedule import (
    FAILED_SYNC_RETRY_SECONDS,
    FULL_SYNC_INTERVAL_SECONDS,
    load_state,
    needs_full_sync,
    record_failed_attempt,
    save_state,
)


class NeedsFullSyncTest(unittest.TestCase):
    def test_first_run_syncs(self):
        self.assertTrue(needs_full_sync({}, "a:1", now=1000)[0])

    def test_unchanged_marker_skips(self):
        state = {"marker": "a:1", "lastFullSyncAt": 1000}
        self.assertEqual(
            needs_full_sync(state, "a:1", now=1600), (False, "no changes")
        )

    def test_changed_marker_syncs(self):
        state = {"marker": "a:1", "lastFullSyncAt": 1000}
        self.assertEqual(
            needs_full_sync(state, "b:2", now=1600), (True, "approvals changed")
        )

    def test_daily_sync(self):
        state = {"marker": "a:1", "lastFullSyncAt": 1000}
        now = 1000 + FULL_SYNC_INTERVAL_SECONDS
        self.assertEqual(needs_full_sync(state, "a:1", now), (True, "daily full sync"))

    def test_unavailable_marker_falls_back_to_syncing(self):
        state = {"marker": "a:1", "lastFullSyncAt": 1000}
        self.assertTrue(needs_full_sync(state, None, now=1600)[0])


    def test_failed_sync_backs_off_while_marker_is_unchanged(self):
        state = {
            "marker": "a:1",
            "lastFullSyncAt": 1000,
            "failedMarker": "b:2",
            "lastFailedAt": 2000,
        }
        self.assertEqual(
            needs_full_sync(state, "b:2", now=2600),
            (False, "retrying a failed sync later"),
        )
        self.assertTrue(
            needs_full_sync(state, "b:2", now=2000 + FAILED_SYNC_RETRY_SECONDS)[0]
        )
        # A new approval retries right away.
        self.assertTrue(needs_full_sync(state, "c:3", now=2600)[0])


class StateFileTest(unittest.TestCase):
    def test_round_trip_and_missing_or_corrupt_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "cache" / "state.json"
            self.assertEqual(load_state(path), {})
            save_state(path, marker="a:1", synced_at=1000)
            self.assertEqual(
                load_state(path), {"marker": "a:1", "lastFullSyncAt": 1000}
            )
            record_failed_attempt(
                path, load_state(path), marker="b:2", failed_at=2000
            )
            self.assertEqual(
                load_state(path),
                {
                    "marker": "a:1",
                    "lastFullSyncAt": 1000,
                    "failedMarker": "b:2",
                    "lastFailedAt": 2000,
                },
            )
            save_state(path, marker="b:2", synced_at=3000)
            self.assertEqual(
                load_state(path), {"marker": "b:2", "lastFullSyncAt": 3000}
            )
            path.write_text("{not json")
            self.assertEqual(load_state(path), {})


if __name__ == "__main__":
    unittest.main()

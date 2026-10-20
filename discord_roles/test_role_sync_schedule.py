import tempfile
import unittest
from pathlib import Path

from role_sync_schedule import (
    FULL_SYNC_INTERVAL_SECONDS,
    load_state,
    needs_full_sync,
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


class StateFileTest(unittest.TestCase):
    def test_round_trip_and_missing_or_corrupt_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "cache" / "state.json"
            self.assertEqual(load_state(path), {})
            save_state(path, marker="a:1", synced_at=1000)
            self.assertEqual(
                load_state(path), {"marker": "a:1", "lastFullSyncAt": 1000}
            )
            path.write_text("{not json")
            self.assertEqual(load_state(path), {})


if __name__ == "__main__":
    unittest.main()

"""
Hogwarts After Dark — Game Data and Mystery Playthrough Tests
Verifies that all game data files for Case 001 parse cleanly and that
the complete mystery can be played to a successful conclusion deterministically.
"""

from __future__ import annotations

import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "services" / "companion"))

from app.game.engine import GameData, GameEngine
from app.models.game_models import ActionRequest, EventType


@pytest.fixture
def actual_game_data() -> GameData:
    data_dir = Path(__file__).parent.parent / "game-data"
    gd = GameData(data_dir)
    gd.load()
    return gd


@pytest.fixture
def actual_engine(actual_game_data: GameData) -> GameEngine:
    return GameEngine(actual_game_data)


class TestGameDataIntegrity:
    def test_case_001_loaded(self, actual_game_data: GameData) -> None:
        assert "case_001" in actual_game_data.cases
        case = actual_game_data.cases["case_001"]
        assert case.title == "The Vanishing Hourglass"
        assert len(case.suspect_ids) >= 3
        assert len(case.clue_ids) >= 5
        assert len(case.location_ids) >= 5

    def test_all_suspects_exist(self, actual_game_data: GameData) -> None:
        case = actual_game_data.cases["case_001"]
        for sid in case.suspect_ids:
            assert sid in actual_game_data.characters, f"Missing suspect character: {sid}"
            char = actual_game_data.characters[sid]
            assert char.is_suspect

    def test_all_locations_exist_and_connected(self, actual_game_data: GameData) -> None:
        case = actual_game_data.cases["case_001"]
        for lid in case.location_ids:
            assert lid in actual_game_data.locations, f"Missing location: {lid}"
            loc = actual_game_data.locations[lid]
            for connected_id in loc.connected_locations:
                assert connected_id in actual_game_data.locations, (
                    f"Location {lid} connects to non-existent location {connected_id}"
                )

    def test_all_clues_exist(self, actual_game_data: GameData) -> None:
        case = actual_game_data.cases["case_001"]
        for cid in case.clue_ids:
            assert cid in actual_game_data.clues, f"Missing clue: {cid}"
            clue = actual_game_data.clues[cid]
            assert clue.location_id in actual_game_data.locations, (
                f"Clue {cid} references invalid location {clue.location_id}"
            )

    def test_solution_is_consistent(self, actual_game_data: GameData) -> None:
        case = actual_game_data.cases["case_001"]
        sol = case.solution
        assert sol.culprit_id in case.suspect_ids, "Culprit must be a listed suspect"
        for req_evidence in sol.required_evidence_ids:
            assert req_evidence in case.clue_ids, (
                f"Required evidence {req_evidence} not listed in case clue_ids"
            )


class TestFullMysteryPlaythrough:
    """
    Simulates a player conducting the full investigation without AI,
    discovering clues, questioning witnesses, casting spells, and reaching
    the correct final verdict.
    """

    def test_full_playthrough_to_verdict(self, actual_engine: GameEngine) -> None:
        # 1. Start session
        session = actual_engine.create_session("case_001")
        sid = session.session_id
        assert session.current_location_id == "loc_entrance_hall"

        # 2. Survey entrance hall
        res = actual_engine.process_action(
            ActionRequest(session_id=sid, action="examine_location")
        )
        assert res.success
        assert "Entrance Hall" in res.state_update["location"]["name"]

        # 3. Move to Archivist's Study
        res = actual_engine.process_action(
            ActionRequest(session_id=sid, action="move", target_id="loc_archivist_study")
        )
        assert res.success
        assert session.current_location_id == "loc_archivist_study"

        # 4. Interview Faelind Grewe (healer present in study)
        res = actual_engine.process_action(
            ActionRequest(session_id=sid, action="interview_character", target_id="suspect_faelind")
        )
        assert res.success
        assert "Faelind" in res.state_update["character"]["name"]

        # 5. Examine empty pedestal
        res = actual_engine.process_action(
            ActionRequest(session_id=sid, action="inspect_clue", target_id="clue_hourglass_pedestal")
        )
        assert res.success
        assert "clue_hourglass_pedestal" in session.discovered_clue_ids

        # 6. Attempt to inspect teacup without spell -> fails due to Specialis Revelio requirement
        res = actual_engine.process_action(
            ActionRequest(session_id=sid, action="inspect_clue", target_id="clue_teacup")
        )
        assert not res.success
        assert "spell_specialis" in res.message

        # 7. Cast Specialis Revelio
        res = actual_engine.process_action(
            ActionRequest(session_id=sid, action="cast_spell", target_id="spell_specialis")
        )
        assert res.success
        assert "Specialis Revelio" in res.message

        # 8. Now inspect teacup -> reveals Dreamroot residue!
        res = actual_engine.process_action(
            ActionRequest(session_id=sid, action="inspect_clue", target_id="clue_teacup")
        )
        assert res.success
        assert "Dreamroot" in res.state_update["clue"]["description"]
        assert "clue_teacup" in session.discovered_clue_ids

        # 9. Move to East Corridor
        res = actual_engine.process_action(
            ActionRequest(session_id=sid, action="move", target_id="loc_east_corridor")
        )
        assert res.success

        # 10. Interview Maris Thornwell
        res = actual_engine.process_action(
            ActionRequest(session_id=sid, action="interview_character", target_id="suspect_maris")
        )
        assert res.success

        # 11. Move to Herbarium
        res = actual_engine.process_action(
            ActionRequest(session_id=sid, action="move", target_id="loc_herbarium")
        )
        assert res.success

        # 12. Interview Corvin Ashwick
        res = actual_engine.process_action(
            ActionRequest(session_id=sid, action="interview_character", target_id="suspect_corvin")
        )
        assert res.success

        # 13. Inspect empty vial near Corvin's workbench
        res = actual_engine.process_action(
            ActionRequest(session_id=sid, action="inspect_clue", target_id="clue_empty_vial")
        )
        assert res.success
        assert "dreamroot" in res.state_update["clue"]["description"].lower()

        # 14. Inspect torn page under Corvin's workbench
        res = actual_engine.process_action(
            ActionRequest(session_id=sid, action="inspect_clue", target_id="clue_torn_page")
        )
        assert res.success
        assert "Temporal Displacement" in res.state_update["clue"]["description"]

        # 15. Submit intermediate hypothesis
        res = actual_engine.process_action(
            ActionRequest(
                session_id=sid,
                action="submit_hypothesis",
                parameters={
                    "hypothesis": "Corvin drugged the archivist with dreamroot to steal the hourglass.",
                    "evidence_ids": ["clue_teacup", "clue_empty_vial", "clue_torn_page"],
                },
            )
        )
        assert res.success

        # 16. Submit wrong verdict -> rejected, game stays active
        res = actual_engine.process_action(
            ActionRequest(
                session_id=sid,
                action="submit_verdict",
                parameters={
                    "culprit_id": "suspect_maris",
                    "evidence_ids": ["clue_broken_lock"],
                },
            )
        )
        assert not res.success
        assert not session.verdict_submitted

        # 17. Submit correct verdict naming Corvin with required evidence
        res = actual_engine.process_action(
            ActionRequest(
                session_id=sid,
                action="submit_verdict",
                parameters={
                    "culprit_id": "suspect_corvin",
                    "evidence_ids": ["clue_teacup", "clue_empty_vial", "clue_torn_page"],
                },
            )
        )
        assert res.success
        assert session.verdict_submitted
        assert session.verdict_correct is True

        # 18. Verify investigation event log completeness in Pensieve
        event_types = [e.event_type for e in session.history]
        assert EventType.LOCATION_VISITED in event_types
        assert EventType.CHARACTER_INTERVIEWED in event_types
        assert EventType.CLUE_DISCOVERED in event_types
        assert EventType.SPELL_CAST in event_types
        assert EventType.HYPOTHESIS_SUBMITTED in event_types
        assert EventType.VERDICT_SUBMITTED in event_types

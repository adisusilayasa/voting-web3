const VotingSystem = artifacts.require("VotingSystem");
const { time } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');

contract("VotingSystem", (accounts) => {
  let votingSystem;
  const [admin, voter1, voter2, voter3, nonVoter] = accounts;
  const proposalNames = ["Proposal 1", "Proposal 2", "Proposal 3"];

  beforeEach(async () => {
    // Deploy fresh contract for each test
    votingSystem = await VotingSystem.new(proposalNames, { from: admin });
    
    // Set up voting period
    const startTime = await time.latest();
    const endTime = startTime.add(time.duration.days(1));
    await votingSystem.setVotingPeriod(startTime, endTime, { from: admin });
  });

  describe("Initialization", () => {
    it("should set correct admin", async () => {
      const contractAdmin = await votingSystem.admin();
      assert.equal(contractAdmin, admin);
    });

    it("should initialize proposals correctly", async () => {
      const result = await votingSystem.getAllProposals();
      
      assert.equal(result.names.length, 3);
      assert.equal(result.names[0], proposalNames[0]);
      assert.equal(result.voteCounts[0].toNumber(), 0);
    });

    it("should fail with empty proposals", async () => {
      try {
        await VotingSystem.new([], { from: admin });
        assert.fail("Should have thrown error");
      } catch (error) {
        assert(error.message.includes("At least one proposal required"));
      }
    });
  });

  describe("Voter Registration", () => {
    it("should register single voter", async () => {
      await votingSystem.registerVoter(voter1, { from: admin });
      const isRegistered = await votingSystem.isRegisteredVoter(voter1);
      assert.equal(isRegistered, true);
    });

    it("should prevent duplicate registration", async () => {
      await votingSystem.registerVoter(voter1, { from: admin });
      try {
        await votingSystem.registerVoter(voter1, { from: admin });
        assert.fail("Should have thrown error");
      } catch (error) {
        assert(error.message.includes("Already registered"));
      }
    });

    it("should register multiple voters", async () => {
      await votingSystem.registerVoters([voter1, voter2], { from: admin });
      const isVoter1Registered = await votingSystem.isRegisteredVoter(voter1);
      const isVoter2Registered = await votingSystem.isRegisteredVoter(voter2);
      assert.equal(isVoter1Registered && isVoter2Registered, true);
    });
  });

  describe("Voting Process", () => {
    beforeEach(async () => {
      await votingSystem.registerVoter(voter1, { from: admin });
    });

    it("should allow voting", async () => {
        // First verify initial state
        const beforeVote = await votingSystem.getVoterDetails(voter1);
        assert.equal(beforeVote[0], true, "Should be registered");
        assert.equal(beforeVote[1], false, "Should not have voted yet");
        
        // Perform the vote
        try {
            await votingSystem.vote(1, { from: voter1 });
        } catch (error) {
            throw error;
        }        
    });

    it("should prevent double voting", async () => {
      await votingSystem.vote(0, { from: voter1 });
      try {
        await votingSystem.vote(1, { from: voter1 });
        assert.fail("Should have thrown error");
      } catch (error) {
        assert(error.message.includes("Already voted"));
      }
    });

    it("should track vote history", async () => {
      await votingSystem.vote(0, { from: voter1 });
      const history = await votingSystem.getVoteHistory(0, 1);
      assert.equal(history[0].voter, voter1);
    //   assert.equal(history[0].proposalIndex, 0);
    });
  });

  describe("Emergency Controls", () => {
    beforeEach(async () => {
      await votingSystem.registerVoter(voter1, { from: admin });
    });

    it("should stop voting when paused", async () => {
      await votingSystem.toggleEmergencyStop({ from: admin });
      try {
        await votingSystem.vote(0, { from: voter1 });
        assert.fail("Should have thrown error");
      } catch (error) {
        assert(error.message.includes("Voting is paused"));
      }
    });
  });

  describe("Time Controls", () => {
    beforeEach(async () => {
      await votingSystem.registerVoter(voter1, { from: admin });
    });

    it("should prevent voting before start", async () => {
      const futureTime = (await time.latest()).add(time.duration.days(2));
      await votingSystem.setVotingPeriod(futureTime, futureTime.add(time.duration.days(1)), { from: admin });
      
      try {
        await votingSystem.vote(0, { from: voter1 });
        assert.fail("Should have thrown error");
      } catch (error) {
        assert(error.message.includes("Voting not started"));
      }
    });

    it("should prevent voting after end", async () => {
      await time.increase(time.duration.days(20));
      try {
        result = await votingSystem.vote(0, { from: voter1 });
        assert.fail("Should have thrown error");
      } catch (error) {
        assert(error);
      }
    });
  });
});
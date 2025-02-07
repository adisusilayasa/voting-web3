const VotingSystem = artifacts.require("VotingSystem");
const { time } = require('@openzeppelin/test-helpers');

contract("VotingSystem", (accounts) => {
  let votingSystem;
  const admin = accounts[0];
  const voter1 = accounts[1];
  const voter2 = accounts[2];
  const voter3 = accounts[3];
  const nonVoter = accounts[4];

  beforeEach(async () => {
    const proposalNames = ["Proposal 1", "Proposal 2", "Proposal 3"];
    votingSystem = await VotingSystem.new(proposalNames, { from: admin });
    
    // Set voting period
    const startTime = await time.latest();
    const endTime = startTime.add(time.duration.days(1));
    await votingSystem.setVotingPeriod(startTime, endTime, { from: admin });
  });

  describe("Deployment", () => {
    it("should set the correct admin", async () => {
      const contractAdmin = await votingSystem.admin();
      assert.equal(contractAdmin, admin, "Admin not set correctly");
    });

    it("should initialize with correct proposal count", async () => {
      const count = await votingSystem.getProposalCount();
      assert.equal(count, 3, "Wrong number of proposals");
    });
  });

  describe("Voter Registration", () => {
    it("should register a single voter", async () => {
      await votingSystem.registerVoter(voter1, { from: admin });
      const isRegistered = await votingSystem.isRegisteredVoter(voter1);
      assert.equal(isRegistered, true, "Voter should be registered");
    });

    it("should register multiple voters", async () => {
      await votingSystem.registerVoters([voter1, voter2], { from: admin });
      const isVoter1Registered = await votingSystem.isRegisteredVoter(voter1);
      const isVoter2Registered = await votingSystem.isRegisteredVoter(voter2);
      assert.equal(isVoter1Registered && isVoter2Registered, true, "Voters should be registered");
    });

    it("should not allow non-admin to register voters", async () => {
      try {
        await votingSystem.registerVoter(voter1, { from: voter2 });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Only admin can perform this action"));
      }
    });
  });

  describe("Voting", () => {
    beforeEach(async () => {
      await votingSystem.registerVoter(voter1, { from: admin });
      await votingSystem.registerVoter(voter2, { from: admin });
    });

    it("should allow registered voter to vote", async () => {
      await votingSystem.vote(0, { from: voter1 });
      const voter = await votingSystem.voters(voter1);
      assert.equal(voter.hasVoted, true, "Voter should have voted");
    });

    it("should not allow unregistered voter to vote", async () => {
      try {
        await votingSystem.vote(0, { from: nonVoter });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("You are not a registered voter"));
      }
    });

    it("should record vote in history", async () => {
      await votingSystem.vote(0, { from: voter1 });
      const history = await votingSystem.getVoteHistory(0, 1);
      assert.equal(history[0].voter, voter1, "Vote record should match voter");
      assert.equal(history[0].proposalIndex, 0, "Vote record should match proposal");
    });
  });

  describe("Emergency Stop", () => {
    it("should allow admin to stop voting", async () => {
      await votingSystem.toggleEmergencyStop({ from: admin });
      const isStopped = await votingSystem.stopped();
      assert.equal(isStopped, true, "Voting should be stopped");
    });

    it("should prevent voting when stopped", async () => {
      await votingSystem.registerVoter(voter1, { from: admin });
      await votingSystem.toggleEmergencyStop({ from: admin });
      try {
        await votingSystem.vote(0, { from: voter1 });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Contract is paused"));
      }
    });
  });

  describe("Winner Determination", () => {
    beforeEach(async () => {
      await votingSystem.registerVoter(voter1, { from: admin });
      await votingSystem.registerVoter(voter2, { from: admin });
      await votingSystem.registerVoter(voter3, { from: admin });
    });

    it("should determine correct winner", async () => {
      await votingSystem.vote(0, { from: voter1 });
      await votingSystem.vote(0, { from: voter2 });
      await votingSystem.vote(1, { from: voter3 });

      const result = await votingSystem.getWinningProposal();
      assert.equal(result.winningIndices[0].toNumber(), 0, "Wrong winning index");
      assert.equal(result.winningNames[0], "Proposal 1", "Wrong winning name");
    });

    it("should handle tie votes", async () => {
      await votingSystem.vote(0, { from: voter1 });
      await votingSystem.vote(1, { from: voter2 });

      const result = await votingSystem.getWinningProposal();
      assert.equal(result.winningIndices.length, 2, "Should have two winners");
      assert.equal(result.winningNames.length, 2, "Should have two winning names");
    });
  });

  describe("Voting Period", () => {
    it("should return correct voting status", async () => {
      const status = await votingSystem.getVotingStatus();
      assert.equal(status.isStarted, true, "Voting should be started");
      assert.equal(status.isEnded, false, "Voting should not be ended");
      assert.equal(status.isActive, true, "Voting should be active");
    });

    it("should not allow voting after end time", async () => {
      await votingSystem.registerVoter(voter1, { from: admin });
      await time.increase(time.duration.days(2));
      
      try {
        await votingSystem.vote(0, { from: voter1 });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert(error.message.includes("Voting has ended"));
      }
    });
  });
});
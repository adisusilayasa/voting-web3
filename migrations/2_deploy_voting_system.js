const VotingSystem = artifacts.require("VotingSystem");

module.exports = async function(deployer) {
  try {
    // Deploy the VotingSystem contract with some initial proposal names
    const proposalNames = ["Jonathan Doe", "John Lawliet", "Ikuzo Kilonzo"];
    await deployer.deploy(VotingSystem, proposalNames);
    const votingInstance = await VotingSystem.deployed();

    // Set voting period (starts now, ends in 7 days)
    const startTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const endTime = startTime + (7 * 24 * 60 * 60); // 7 days from now
    await votingInstance.setVotingPeriod(startTime, endTime);

    console.log("VotingSystem deployed successfully at:", votingInstance.address);
    console.log("Voting period set from", new Date(startTime * 1000).toLocaleString(), 
                "to", new Date(endTime * 1000).toLocaleString());

  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
};
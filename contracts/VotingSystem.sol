// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract VotingSystem {
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 vote;
    }

    struct Proposal {
        string name;
        uint256 voteCount;
    }

    struct VoteRecord {
        address voter;
        uint256 proposalIndex;
        uint256 timestamp;
    }

    address public immutable admin;
    Proposal[] public proposals;
    mapping(address => Voter) public voters;
    VoteRecord[] public voteHistory;
    mapping(address => bool) private seen;

    uint256 public votingStart;
    uint256 public votingEnd;
    bool public stopped;

    event VotingStarted(uint256 startTime, uint256 endTime);
    event EmergencyStop(bool stopped);
    event VoterRegistered(address indexed voter);
    event Voted(address indexed voter, uint256 proposalIndex);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyRegisteredVoters() {
        require(voters[msg.sender].isRegistered, "Not a registered voter");
        _;
    }

    modifier notStopped() {
        require(!stopped, "Voting is paused");
        _;
    }

    modifier onlyDuringVoting() {
        require(block.timestamp >= votingStart, "Voting not started");
        require(block.timestamp <= votingEnd, "Voting ended");
        _;
    }

    constructor(string[] memory proposalNames) {
        require(proposalNames.length > 0, "At least one proposal required");
        admin = msg.sender;
        for (uint256 i = 0; i < proposalNames.length; ) {
            proposals.push(Proposal({name: proposalNames[i], voteCount: 0}));
            unchecked { i++; }
        }
    }

    function setVotingPeriod(uint256 start, uint256 end) external onlyAdmin {
        require(start < end, "Invalid voting period");
        require(end > block.timestamp, "End time must be in the future");
        votingStart = start;
        votingEnd = end;
        emit VotingStarted(start, end);
    }

    function getVotingPeriod() public view returns (uint256, uint256) {
        return (votingStart, votingEnd);
    }    

    function vote(uint256 proposalIndex) external onlyRegisteredVoters onlyDuringVoting notStopped {
        Voter storage sender = voters[msg.sender];
        require(!sender.hasVoted, "Already voted");
        require(proposalIndex < proposals.length, "Invalid proposal index");

        sender.hasVoted = true;
        sender.vote = proposalIndex;
        proposals[proposalIndex].voteCount++;

        voteHistory.push(VoteRecord({
            voter: msg.sender,
            proposalIndex: proposalIndex,
            timestamp: block.timestamp
        }));

        emit Voted(msg.sender, proposalIndex);
    }

    function registerVoter(address voterAddress) external onlyAdmin {
        require(voterAddress != address(0), "Invalid address");
        require(!voters[voterAddress].isRegistered, "Already registered");

        voters[voterAddress] = Voter(true, false, 0);
        emit VoterRegistered(voterAddress);
    }

    function registerVoters(address[] calldata voterAddresses) external onlyAdmin {
        require(voterAddresses.length > 0, "Empty list");
        require(voterAddresses.length <= 100, "Too many voters");

        for (uint256 i = 0; i < voterAddresses.length; ) {
            address voter = voterAddresses[i];
            if (voter != address(0) && !voters[voter].isRegistered && !seen[voter]) {
                voters[voter] = Voter(true, false, 0);
                seen[voter] = true;
                emit VoterRegistered(voter);
            }
            unchecked { i++; }
        }
    }

    function getWinningProposal() external view returns (uint256[] memory, string[] memory) {
        if (proposals.length == 0) return (new uint256[](0) ,new string[](0));
        uint256 maxVotes = 0;
        uint256 winnerCount = 0;

        for (uint256 i = 0; i < proposals.length; ) {
            uint256 currentVotes = proposals[i].voteCount;
            if (currentVotes > maxVotes) {
                maxVotes = currentVotes;
                winnerCount = 1;
            } else if (currentVotes == maxVotes) {
                winnerCount++;
            }
            unchecked { i++; }
        }

        uint256[] memory winningIndices = new uint256[](winnerCount);
        string[] memory winningNames = new string[](winnerCount);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < proposals.length; ) {
            if (proposals[i].voteCount == maxVotes) {
                winningIndices[currentIndex] = i;
                winningNames[currentIndex] = proposals[i].name;
                currentIndex++;
            }
            unchecked { i++; }
        }

        return (winningIndices, winningNames);
    }

    function getVoteHistory(uint256 startIndex, uint256 endIndex) 
        external 
        view 
        returns (VoteRecord[] memory) 
    {
        require(startIndex <= endIndex, "Invalid range");
        require(startIndex < voteHistory.length, "Start index out of bounds");

        endIndex = endIndex > voteHistory.length ? voteHistory.length : endIndex;
        uint256 length = endIndex - startIndex;
        VoteRecord[] memory history = new VoteRecord[](length);

        unchecked {
            for (uint256 i = 0; i < length; i++) {
                history[i] = voteHistory[startIndex + i];
            }
        }

        return history;
    }

    function getVoterDetails(address voterAddress) 
        external 
        view 
        returns (bool isRegistered, bool hasVoted, uint256 votedFor) 
    {
        Voter memory voter = voters[voterAddress];
        return (voter.isRegistered, voter.hasVoted, voter.vote);
    }

    function isRegisteredVoter(address voterAddress) external view returns (bool) {
        return voters[voterAddress].isRegistered;
    }

    function isAdmin(address account) external view returns (bool) {
        return account == admin;
    }

    function getVotingStatus() external view returns (
        bool isStarted,
        bool isEnded,
        bool isActive,
        uint256 timeLeft
    ) {
        isStarted = block.timestamp >= votingStart;
        isEnded = block.timestamp > votingEnd;
        isActive = isStarted && !isEnded && !stopped;
        timeLeft = isEnded ? 0 : (isStarted ? votingEnd - block.timestamp : votingEnd - votingStart);
        return (isStarted, isEnded, isActive, timeLeft);
    }

    function toggleEmergencyStop() external onlyAdmin {
        stopped = !stopped;
        emit EmergencyStop(stopped);
    }

    function getAllProposals() external view returns (
        string[] memory names,
        uint256[] memory voteCounts
    ) {
        names = new string[](proposals.length);
        voteCounts = new uint256[](proposals.length);
        
        for (uint256 i = 0; i < proposals.length; ) {
            names[i] = proposals[i].name;
            voteCounts[i] = proposals[i].voteCount;
            unchecked { i++; }
        }

        return (names, voteCounts);
    }
}

# Decentralized Voting System

A blockchain-based voting system built on Ethereum that enables secure, transparent, and verifiable voting processes.

## Tech Stack

- **Smart Contracts**: Solidity ^0.8.21
- **Development Framework**: Truffle Suite
- **Network**: Sepolia Testnet
- **Node Provider**: Google Blockchain Node Engine
- **Testing**: Mocha & Chai
- **Development Tools**:
  - OpenZeppelin Test Helpers
  - HDWallet Provider

## Features

- Secure voter registration system
- Time-bound voting periods
- Multiple proposal support
- Emergency stop functionality
- Vote history tracking
- Real-time voting status
- Admin controls

## Smart Contract Architecture

### Core Components

1. **Voter Management**
   - Registration system
   - Vote tracking
   - Duplicate prevention

2. **Proposal Handling**
   - Multiple proposals support
   - Vote counting
   - Winner determination

3. **Time Management**
   - Configurable voting periods
   - Start/End time enforcement

4. **Security Features**
   - Admin-only functions
   - Emergency stop mechanism
   - Access control modifiers

## Local Development Setup

1. **Prerequisites**
```bash
# Install Node.js (v14+ recommended)
# Install Truffle globally
npm install -g truffle
```

2. **Clone and Install**
```bash
git clone <repository-url>
cd voting-web3
npm install
```

3. **Environment Configuration**
```bash
# Create .env file
cp .env.example .env

# Configure your environment variables
SEPOLIA_RPC_URL=your_rpc_url
PRIVATE_KEY=your_private_key
```

4. **Compile Contracts**
```bash
truffle compile
```

5. **Run Tests**
```bash
# Run all tests
truffle test

# Run coverage
truffle run coverage
```

6. **Local Deployment**
```bash
# Start local blockchain
truffle develop

# Deploy contracts (in truffle console)
migrate
```

## Deployment

### Sepolia Testnet Deployment

1. Ensure your wallet has sufficient Sepolia ETH
2. Deploy using truffle:
```bash
truffle migrate --network sepolia
```

Current Deployment:
- Contract Address: `0xEC9ed0d744839BC4Ed2d8d94a07e7E244F3C7d5b`
- Network: Sepolia Testnet
- Deployment Cost: 0.00722988 ETH
- Block Number: 7690639

## Contract Interaction

### Admin Functions

1. **Register Voters**
```javascript
await votingSystem.registerVoter(voterAddress, { from: admin });
```

2. **Set Voting Period**
```javascript
await votingSystem.setVotingPeriod(startTime, endTime, { from: admin });
```

3. **Emergency Stop**
```javascript
await votingSystem.toggleEmergencyStop({ from: admin });
```

### Voter Functions

1. **Cast Vote**
```javascript
await votingSystem.vote(proposalIndex, { from: voter });
```

2. **Check Voting Status**
```javascript
const status = await votingSystem.getVotingStatus();
```

## Security Considerations

- Private keys should never be committed to version control
- Use `.env` for sensitive configuration
- Admin wallet should be secured properly
- Regular security audits recommended

## Testing

The system includes comprehensive tests covering:
- Initialization
- Voter Registration
- Voting Process
- Emergency Controls
- Time Controls

Run tests with:
```bash
truffle test
```

## License

MIT License

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
```

This documentation provides a comprehensive overview of your voting system, including setup instructions, deployment details, and interaction guidelines. Let me know if you need any specific section expanded or clarified.
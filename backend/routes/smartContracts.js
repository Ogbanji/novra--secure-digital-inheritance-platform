import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all smart contracts for user
router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const contracts = db.prepare(`
      SELECT id, contract_type, contract_address, network, status, deployed_at, created_at
      FROM smart_contracts 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.userId);

    res.json(contracts.map(contract => ({
      ...contract,
      beneficiaries: JSON.parse(contract.beneficiaries || '[]')
    })));
  } catch (error) {
    console.error('Get contracts error:', error);
    res.status(500).json({ error: 'Failed to fetch smart contracts' });
  }
});

// Create smart contract (draft)
router.post('/', (req, res) => {
  try {
    const { contractType, beneficiaries, network } = req.body;
    const db = req.app.locals.db;

    if (!contractType || !beneficiaries || beneficiaries.length === 0) {
      return res.status(400).json({
        error: 'Contract type and beneficiaries required'
      });
    }

    const contractId = uuidv4();

    db.prepare(`
      INSERT INTO smart_contracts (
        id, user_id, contract_type, beneficiaries, network, status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      contractId,
      req.user.userId,
      contractType,
      JSON.stringify(beneficiaries),
      network || 'polygon',
      'draft'
    );

    res.status(201).json({
      message: 'Smart contract created (draft)',
      contractId,
      contractType
    });
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({ error: 'Failed to create smart contract' });
  }
});

// Get contract details
router.get('/:contractId', (req, res) => {
  try {
    const db = req.app.locals.db;
    const contract = db.prepare(`
      SELECT * FROM smart_contracts 
      WHERE id = ? AND user_id = ?
    `).get(req.params.contractId, req.user.userId);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json({
      ...contract,
      beneficiaries: JSON.parse(contract.beneficiaries || '[]')
    });
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

// Deploy contract
router.post('/:contractId/deploy', (req, res) => {
  try {
    const { contractAddress } = req.body;
    const db = req.app.locals.db;

    const contract = db.prepare('SELECT id FROM smart_contracts WHERE id = ? AND user_id = ?')
      .get(req.params.contractId, req.user.userId);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    db.prepare(`
      UPDATE smart_contracts 
      SET status = 'deployed', contract_address = ?, deployed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(contractAddress, req.params.contractId);

    res.json({
      message: 'Contract deployed',
      contractAddress
    });
  } catch (error) {
    console.error('Deploy contract error:', error);
    res.status(500).json({ error: 'Failed to deploy contract' });
  }
});

// Get contract code template
router.get('/:contractId/code', (req, res) => {
  try {
    const db = req.app.locals.db;
    const contract = db.prepare('SELECT contract_type, beneficiaries FROM smart_contracts WHERE id = ? AND user_id = ?')
      .get(req.params.contractId, req.user.userId);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const beneficiaries = JSON.parse(contract.beneficiaries || '[]');

    const solidityCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract InheritanceVault {
    address public owner;
    address[] public heirs;
    mapping(address => uint256) public inheritanceShare;
    
    uint256 public lastActivityTime;
    uint256 public inactivityThreshold = 365 days;
    bool public inheritanceTriggered;
    
    mapping(address => uint256) public claimedAmount;
    
    event InheritanceTriggered();
    event AssetClaimed(address indexed heir, uint256 amount);
    
    constructor() {
        owner = msg.sender;
        lastActivityTime = block.timestamp;
        
        // Beneficiaries configuration
        ${beneficiaries.map((b, i) => `heirs.push(${b.address}); inheritanceShare[${b.address}] = ${b.share};`).join('\n        ')}
    }
    
    receive() external payable {}
    
    function updateActivity() external {
        require(msg.sender == owner, "Only owner");
        lastActivityTime = block.timestamp;
    }
    
    function triggerInheritance() external {
        require(
            block.timestamp >= lastActivityTime + inactivityThreshold,
            "Owner still active"
        );
        inheritanceTriggered = true;
        emit InheritanceTriggered();
    }
    
    function claimInheritance() external {
        require(inheritanceTriggered, "Inheritance not triggered");
        require(_isHeir(msg.sender), "Not an heir");
        require(claimedAmount[msg.sender] == 0, "Already claimed");
        
        uint256 heirShare = inheritanceShare[msg.sender];
        uint256 heirAmount = (address(this).balance * heirShare) / 100;
        
        claimedAmount[msg.sender] = heirAmount;
        payable(msg.sender).transfer(heirAmount);
        
        emit AssetClaimed(msg.sender, heirAmount);
    }
    
    function _isHeir(address _address) internal view returns (bool) {
        for (uint i = 0; i < heirs.length; i++) {
            if (heirs[i] == _address) return true;
        }
        return false;
    }
}`;

    res.json({
      code: solidityCode,
      language: 'solidity',
      version: '^0.8.0'
    });
  } catch (error) {
    console.error('Get code error:', error);
    res.status(500).json({ error: 'Failed to generate contract code' });
  }
});

// Delete contract
router.delete('/:contractId', (req, res) => {
  try {
    const db = req.app.locals.db;

    const contract = db.prepare('SELECT id FROM smart_contracts WHERE id = ? AND user_id = ?')
      .get(req.params.contractId, req.user.userId);

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    db.prepare('DELETE FROM smart_contracts WHERE id = ?').run(req.params.contractId);

    res.json({ message: 'Contract deleted' });
  } catch (error) {
    console.error('Delete contract error:', error);
    res.status(500).json({ error: 'Failed to delete contract' });
  }
});

export default router;
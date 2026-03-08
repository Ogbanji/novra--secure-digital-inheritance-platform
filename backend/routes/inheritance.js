import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all inheritance rules
router.get('/', (req, res) => {
  try {
    const db = req.app.locals.db;
    const rules = db.prepare(`
      SELECT id, rule_type, trigger_condition, release_date, 
             beneficiaries, affected_vaults, status, triggered_at, created_at
      FROM inheritance_rules 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.userId);

    res.json(rules.map(rule => ({
      ...rule,
      trigger_condition: JSON.parse(rule.trigger_condition || '{}'),
      beneficiaries: JSON.parse(rule.beneficiaries || '[]'),
      affected_vaults: JSON.parse(rule.affected_vaults || '[]')
    })));
  } catch (error) {
    console.error('Get rules error:', error);
    res.status(500).json({ error: 'Failed to fetch inheritance rules' });
  }
});

// Create inheritance rule
router.post('/', (req, res) => {
  try {
    const {
      ruleType,
      triggerCondition,
      releaseDate,
      inactivityDays,
      beneficiaries,
      affectedVaults
    } = req.body;
    const db = req.app.locals.db;

    if (!ruleType || !beneficiaries || beneficiaries.length === 0) {
      return res.status(400).json({
        error: 'Rule type and at least one beneficiary required'
      });
    }

    const ruleId = uuidv4();

    db.prepare(`
      INSERT INTO inheritance_rules (
        id, user_id, rule_type, trigger_condition, release_date,
        inactivity_days, beneficiaries, affected_vaults, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ruleId,
      req.userId,
      ruleType,
      JSON.stringify(triggerCondition || {}),
      releaseDate || null,
      inactivityDays || null,
      JSON.stringify(beneficiaries),
      JSON.stringify(affectedVaults || []),
      'active'
    );

    res.status(201).json({
      message: 'Inheritance rule created',
      ruleId,
      ruleType
    });
  } catch (error) {
    console.error('Create rule error:', error);
    res.status(500).json({ error: 'Failed to create inheritance rule' });
  }
});

// Get rule details
router.get('/:ruleId', (req, res) => {
  try {
    const db = req.app.locals.db;
    const rule = db.prepare(`
      SELECT * FROM inheritance_rules 
      WHERE id = ? AND user_id = ?
    `).get(req.params.ruleId, req.userId);

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    res.json({
      ...rule,
      trigger_condition: JSON.parse(rule.trigger_condition || '{}'),
      beneficiaries: JSON.parse(rule.beneficiaries || '[]'),
      affected_vaults: JSON.parse(rule.affected_vaults || '[]')
    });
  } catch (error) {
    console.error('Get rule error:', error);
    res.status(500).json({ error: 'Failed to fetch rule' });
  }
});

// Update rule
router.put('/:ruleId', (req, res) => {
  try {
    const {
      triggerCondition,
      releaseDate,
      inactivityDays,
      beneficiaries,
      affectedVaults
    } = req.body;
    const db = req.app.locals.db;

    const rule = db.prepare('SELECT id FROM inheritance_rules WHERE id = ? AND user_id = ?')
      .get(req.params.ruleId, req.userId);

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    db.prepare(`
      UPDATE inheritance_rules 
      SET trigger_condition = ?, release_date = ?, inactivity_days = ?,
          beneficiaries = ?, affected_vaults = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      JSON.stringify(triggerCondition || {}),
      releaseDate || null,
      inactivityDays || null,
      JSON.stringify(beneficiaries || []),
      JSON.stringify(affectedVaults || []),
      req.params.ruleId
    );

    res.json({ message: 'Rule updated' });
  } catch (error) {
    console.error('Update rule error:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

// Deactivate rule
router.post('/:ruleId/deactivate', (req, res) => {
  try {
    const db = req.app.locals.db;

    const rule = db.prepare('SELECT id FROM inheritance_rules WHERE id = ? AND user_id = ?')
      .get(req.params.ruleId, req.userId);

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    db.prepare('UPDATE inheritance_rules SET status = ? WHERE id = ?')
      .run('cancelled', req.params.ruleId);

    res.json({ message: 'Rule deactivated' });
  } catch (error) {
    console.error('Deactivate rule error:', error);
    res.status(500).json({ error: 'Failed to deactivate rule' });
  }
});

// Delete rule
router.delete('/:ruleId', (req, res) => {
  try {
    const db = req.app.locals.db;

    const rule = db.prepare('SELECT id FROM inheritance_rules WHERE id = ? AND user_id = ?')
      .get(req.params.ruleId, req.userId);

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    db.prepare('DELETE FROM inheritance_rules WHERE id = ?').run(req.params.ruleId);

    res.json({ message: 'Rule deleted' });
  } catch (error) {
    console.error('Delete rule error:', error);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

// Get triggered rules (for admin/monitoring)
router.get('/status/triggered', (req, res) => {
  try {
    const db = req.app.locals.db;
    const triggered = db.prepare(`
      SELECT id, rule_type, beneficiaries, triggered_at
      FROM inheritance_rules 
      WHERE user_id = ? AND status = 'triggered'
    `).all(req.userId);

    res.json(triggered.map(rule => ({
      ...rule,
      beneficiaries: JSON.parse(rule.beneficiaries || '[]')
    })));
  } catch (error) {
    console.error('Triggered rules error:', error);
    res.status(500).json({ error: 'Failed to fetch triggered rules' });
  }
});

// Get upcoming scheduled releases
router.get('/schedule/upcoming', (req, res) => {
  try {
    const db = req.app.locals.db;
    const upcoming = db.prepare(`
      SELECT id, release_date, beneficiaries, status
      FROM inheritance_rules 
      WHERE user_id = ? AND release_date IS NOT NULL
      AND release_date > datetime('now')
      ORDER BY release_date ASC
      LIMIT 10
    `).all(req.userId);

    res.json(upcoming.map(rule => ({
      ...rule,
      beneficiaries: JSON.parse(rule.beneficiaries || '[]')
    })));
  } catch (error) {
    console.error('Upcoming releases error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming releases' });
  }
});

// Get inactivity status
router.get('/status/inactivity', (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = db.prepare('SELECT last_activity FROM users WHERE id = ?')
      .get(req.userId);

    const lastActivityDate = new Date(user.last_activity);
    const now = new Date();
    const daysSinceActivity = Math.floor((now - lastActivityDate) / (1000 * 60 * 60 * 24));

    // Get active dead-man switch rules
    const rules = db.prepare(`
      SELECT id, inactivity_days, status
      FROM inheritance_rules 
      WHERE user_id = ? AND rule_type = 'dead_man_switch' AND status = 'active'
    `).all(req.userId);

    const inactivityStatus = rules.map(rule => {
      const daysUntilTrigger = Math.max(0, rule.inactivity_days - daysSinceActivity);
      return {
        ruleId: rule.id,
        inactivityDays: rule.inactivity_days,
        daysSinceLastActivity,
        daysUntilTrigger,
        status: daysUntilTrigger === 0 ? 'triggered' : 'active',
        percentComplete: Math.round((daysSinceActivity / rule.inactivity_days) * 100)
      };
    });

    res.json({
      lastActivity: lastActivityDate.toISOString(),
      daysSinceActivity,
      rules: inactivityStatus
    });
  } catch (error) {
    console.error('Inactivity status error:', error);
    res.status(500).json({ error: 'Failed to fetch inactivity status' });
  }
});

export default router;
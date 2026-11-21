import express from 'express';

const router = express.Router({ mergeParams: true });

// Brand Knowledge API router
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Brand Knowledge API' });
});

export default router;

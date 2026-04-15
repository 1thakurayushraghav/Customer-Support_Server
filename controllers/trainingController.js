import TrainingData from "../models/TrainingData.js";

// ADD TRAINING DATA
export const addTraining = async (req, res) => {
    try {
        const { question, answer, category, keywords } = req.body;

        const data = await TrainingData.create({
            question,
            answer,
            category,
            keywords,
            createdBy: req.user._id
        });

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ error: "Failed to add training" });
    }
};

// GET ALL TRAINING DATA
export const getTraining = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const search = req.query.search || "";
        const category = req.query.category || "all";

        let query = {};

        if (search) {
            query.$or = [
                { question: { $regex: search, $options: "i" } },
                { answer: { $regex: search, $options: "i" } },
                { keywords: { $regex: search, $options: "i" } }
            ];
        }

        if (category !== "all") {
            query.category = category;
        }

        const total = await TrainingData.countDocuments(query);

        const data = await TrainingData.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            data,
            total,
            page,
            pages: Math.ceil(total / limit)
        });

    } catch (err) {
        res.status(500).json({ error: "Failed to fetch training data" });
    }
};

// Add to trainingController.js
export const updateTraining = async (req, res) => {
    try {
        const { question, answer, category, keywords, priority } = req.body;
        const updated = await TrainingData.findByIdAndUpdate(
            req.params.id,
            { question, answer, category, keywords, priority },
            { new: true, runValidators: true }
        );
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ error: "Failed to update training" });
    }
};

// DELETE
export const deleteTraining = async (req, res) => {
    await TrainingData.findByIdAndDelete(req.params.id);
    res.json({ success: true });
};


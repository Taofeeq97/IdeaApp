import express from 'express'
import Idea from '../models/idea.js'
import mongoose from 'mongoose'

import { protect } from '../middleware/authmiddleware.js'

const router = express.Router()

router.get('/', async (req, res, next) => {
    try {
        const limit = parseInt(req.query._limit);
        const query = Idea.find().sort({createdAt: -1})

        if (!isNaN(limit)) {
            query.limit(limit)
        }

        const ideas = await query.exec();
        res.json(ideas)
    } catch (err) {
        next(err)
    }
})


router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(404)
            throw new Error ('Idea Not Founs')
        }
        const idea = await Idea.findById(id)
        if (!idea) {
            res.status(404)
            throw new Error ('Idea Not Founs')
        }
        res.json(idea);
    } catch (err) {
        next(err)
    }
})


router.post('/',protect, async (req, res, next) => {
    try {
        const {title, description, summary, tags} = req.body || {};
        if (!title?.trim() || !description?.trim() || !summary?.trim()) {
            res.status(400)
            throw new Error('Title , description and summary are required')
        }
        const newIdea = new Idea({
            title,
            description,
            summary,
            tags: typeof tags === 'string'? 
                tags.split(',')
                .map((tag)=>tag.trim())
                .filter(Boolean)
                : Array.isArray(tags)
                ? tags 
                : [],
            user: req.user._id
        });
        const savedIdea = await newIdea.save()
        res.status(201).json(savedIdea)
    } catch (err) {
        console.log('err',err)
        next(err)
    }
})


router.delete('/:id', protect, async (req, res, next) => {
    try {
        const { id } = req.params

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(404)
            throw new Error ('Idea Not Founs')
        }
        const idea = await Idea.findById(id)
        if (!idea) {
            res.status(401)
            throw new Error('Idea not found')
        }

        if (idea.user.toString() !== req.user._id.toString()) {
            res.status(403)
            throw new Error('unauthorized')
        }

        await idea.deleteOne()

        if (!idea) {
            res.status(404)
            throw new Error ('Idea Not Founs')
        }
        res.json({message: "Idea deleted successfully"});
    } catch (err) {
        next(err)
    }
})

router.put('/:id', protect, async(req, res, next) => {
    console.log(req.body)
    try {
        const { id } = req.params
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(404)
            throw new Error('Idea Not Found')
        }

        const idea = await Idea.findById(id)

        if (!idea) {
            res.status(401)
            throw new Error('Idea not found')
        }

        if (idea.user.toString() !== req.user._id.toString()) {
            res.status(403)
            throw new Error('unauthorized')
        }

        
        const { title, summary, description, tags } = req.body || {};
        if (!title?.trim() || !description?.trim() || !summary?.trim()) {
            res.status(400)
            throw new Error('Title, description and summary are required')
        }
        const updatedIdea = await Idea.findByIdAndUpdate(id, {
            title: title.trim(),
            description: description.trim(),
            summary: summary.trim(),
            tags: Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())
        }, { new: true, runValidators: true })

        if (!updatedIdea) {
            res.status(404)
            throw new Error('Idea not found')
        }

        res.json(updatedIdea)

    } catch (err) {
        next(err)
    }
})


export default router 
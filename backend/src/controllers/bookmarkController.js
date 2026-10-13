import Bookmark from '../models/Bookmark.js';
import Event from '../models/Event.js';

export const addBookmark = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists and is accessible
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const bookmark = await Bookmark.findOneAndUpdate(
      { user: req.user._id, event: eventId },
      { user: req.user._id, event: eventId },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      success: true,
      message: 'Event bookmarked successfully',
      data: bookmark,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeBookmark = async (req, res) => {
  try {
    const { eventId } = req.params;

    await Bookmark.findOneAndDelete({
      user: req.user._id,
      event: eventId,
    });

    res.json({
      success: true,
      message: 'Bookmark removed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate({
        path: 'event',
        populate: { path: 'organizer', select: 'name email department' },
      })
      .sort({ createdAt: -1 });

    // Filter out any events that were unpublished or cancelled/deleted
    const validBookmarks = bookmarks
      .filter((b) => b.event && ['published', 'cancelled'].includes(b.event.status))
      .map((b) => b.event);

    res.json({
      success: true,
      count: validBookmarks.length,
      data: validBookmarks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkIsBookmarked = async (req, res) => {
  try {
    const { eventId } = req.params;
    const exists = await Bookmark.exists({ user: req.user._id, event: eventId });
    res.json({
      success: true,
      isBookmarked: Boolean(exists),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

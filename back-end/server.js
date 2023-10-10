const express = require('express')
const cors = require('cors')
const app = express()
const cookieParser = require("cookie-parser")
const session = require("express-session")
const { User, Post, Comment, sequelize } = require('./models')
const { request } = require('http')
const sessionStore = require('express-session-sequelize')(session.Store)

const sequelizeSessionStore = new sessionStore({
    db: sequelize
});

app.use(cookieParser());
app.use(express.json())
app.use(cors())
app.use(session({
    secret: "secretpass",
    cookie: {
        maxAge: 1000 * 60 * 60
    },
    resave: true,
    store: sequelizeSessionStore,
    saveUninitialized: true,
}))
// Work in Progress : Session Storage For React

// app.get('/', (req, res) => {
//     User.findByPk(1).then((user) => {
//         console.log(user)
//             req.session.userId = user.id
//             req.session.username = user.userName
//             res.json({ success: true});
//         })
// })

app.get('/user/', async (req, res) => {
    const userId = req.session.userId
    try {
        const user = await User.findAll({
            include: [
                {
                    model: Post,
                    order: [['updatedAt', 'DESC']],
                    required: false,
                    include: [
                        {
                            model: Comment,
                            required: false,
                        }
                    ]
                }
            ]
        });
        res.json(user);
    } catch (error) {
        console.error('Error fetching user information:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
//user 
app.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const user = await User.findByPk(userId, {
            include: [
                {
                    model: Post,
                    required: false,
                    include: [
                        {
                            model: Comment,
                            required: false,
                        }
                    ]
                }
            ]
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user information:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});





app.get('/Posts' , async (req,res) => {
    const postId = req.params.postId; // Get the post ID from the URL parameter
    try {
        const post = await Post.findAll({
            include: [
                {
                    model: Comment,
                    required: false,
                },
            ],
        });
        if (post) {
            res.json(post); 
        } else {
            res.status(404).json({ error: 'Post not found' }); 
        }
    } catch (error) {
        console.error('Error fetching post information:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})
//Creates a new Post
app.post('/Posts/', (req, res) => {
    const { blogContent, title, userId } = req.body

    if (!blogContent) {
        return res.json({ err: "You need to type something to people" })
    }
    Post.create({
        blogContent: blogContent,
        title: title,
        userId: 1,
    }).then((newPost) => {
        res.json(newPost)
    })
})
app.get('/Posts/:postId', async (req, res) => {
    const postId = req.params.postId; // Get the post ID from the URL parameter
    try {
        const post = await Post.findByPk(postId, {
            include: [
                {
                    model: Comment,
                    required: false,
                },
            ],
        });
        if (post) {
            res.json(post); 
        } else {
            res.status(404).json({ error: 'Post not found' }); 
        }
    } catch (error) {
        console.error('Error fetching post information:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put("/Posts/:id", async (req, res) => {
    const { blogContent } = req.body;
    const { id } = req.params;

    const updateFields = {};

    if (blogContent) {
        updateFields.blogContent = blogContent;

        await Post.update(updateFields, { where: { id: id } })
            .then((result) => {
                if (result[0] === 1) {
                    res.json({ success: true });
                } else {
                    console.log('Comment not found or no changes to update.');
                    res.status(404).json({ error: 'Comment not found or no changes to update.' });
                }
            })
            .catch((error) => {
                console.error('Error updating comment:', error);
                res.status(500).json({ error: 'Server error' });
            });
    } else {
        res.status(400).json({ error: 'Invalid request, commentContent is required.' });
    }
});

//gets all of the comments and loads them to corresponding post
app.get('/comments/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const comments = await Comment.findAll({
            where: { postId: id },
        });

        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//creates a new comment
app.post('/comments/', (req, res) => {
    const { commentContent, commentName, likes, dislikes, postId } = req.body
    if (!commentContent) {
        return res.json({ err: "Please enter a comment before submitting" })
    }
    Comment.create({
        commentContent: commentContent,
        commentName: commentName,
        likes: likes,
        dislikes: dislikes,
        postId: postId
    }).then((newComment) => {
        res.json(newComment)
    })
})

app.delete("/comments/:id", (req, res) => {
    const { id } = req.params;

    Comment.destroy({ where: { id } }).then(() => {
        Comment.findAll()
            .then((comments) => {
                res.json({ comments });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: 'Server error' });
            });
    });
});

app.put("/comments/:id", async (req, res) => {
    const { commentContent } = req.body;
    const { id } = req.params;

    const updateFields = {};

    if (commentContent) {
        updateFields.commentContent = commentContent;

        await Comment.update(updateFields, { where: { id: id } })
            .then((result) => {
                if (result[0] === 1) {
                    console.log('Comment information updated successfully.');
                    res.json({ success: true });
                } else {
                    console.log('Comment not found or no changes to update.');
                    res.status(404).json({ error: 'Comment not found or no changes to update.' });
                }
            })
            .catch((error) => {
                console.error('Error updating comment:', error);
                res.status(500).json({ error: 'Server error' });
            });
    } else {
        res.status(400).json({ error: 'Invalid request, commentContent is required.' });
    }
});

app.post('/comments/:id/dislike', async (req, res) => {
    const { id } = req.params;

    try {
        const comment = await Comment.findByPk(id);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        comment.dislikes += 1;
        await comment.save();
        res.json(comment);
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/comments/:id/like', async (req, res) => {
    const { id } = req.params;

    try {
        const comment = await Comment.findByPk(id);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        comment.likes += 1;
        await comment.save();
        res.json(comment);
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/commentstest', (req, res) => {
    const { blogId, commentuserName, commentContent, commentId } = req.body
    const testComment =
    {
        blogId: blogId,
        commentId: commentId,
        commentuserName: commentuserName,
        commentContent: commentContent
    }
    Comments.push(testComment)
    res.status(201).json(testComment)
})


app.delete('comments/:commentId/', async (req, res) => {
    const commentId = req.params;

    try {
        const comment = await Comment.findByPk(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        await comment.destroy();

        res.json({ status: "comment deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(3001, () => {
    console.log('app is started on port 3001')
})
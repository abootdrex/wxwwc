import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, Typography, Card, CardContent, CssBaseline, } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { collection, addDoc, serverTimestamp, arrayUnion, query, orderBy, } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../firebase'; // Import your Firebase config
import { UserAuth } from '../context/AuthContext';
import { doc, getDocs, updateDoc } from 'firebase/firestore';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { styled } from '@mui/material/styles';





const Home = () => {

  const VisuallyHiddenInput = styled('input')`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;


  const [imageUpload, setImageUpload] = useState(null);
  const [title, setTitle] = useState('');
  const [commentText, setCommentText] = useState('');
  const [data, setData] = useState([]);
  const [comments, setComments] = useState([]);
  const { user } = UserAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [likedPosts, setLikedPosts] = useState([]);
  const [content, setContent] = useState('');
  const handleClickOpen = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpen(true);
  };

  const handleClose = () => {
    setSelectedImage(null);
    setOpen(false);
  };

  const uploadFile = () => {
    if (!imageUpload || !title || !content || !user) return;
    const imageRef = ref(storage, `images/${imageUpload.name}`);

    uploadBytes(imageRef, imageUpload)
      .then((snapshot) => {
        getDownloadURL(snapshot.ref)
          .then((url) => {
            addDoc(collection(database, 'posts'), {
              userId: user.uid,
              title,
              content,
              imageUrl: url,
              authorEmail: user.email,
              authorName: user.displayName,
              timestamp: serverTimestamp(),
            })
              .then(() => {
                console.log('Data added to Firestore');
                setUploadSuccess(true);
              })
              .catch((error) => {
                console.error('Error adding data to Firestore', error);
                setUploadSuccess(false);
              });
          })
          .catch((error) => {
            console.error(error);
            setUploadSuccess(false);
          });
      })
      .catch((error) => {
        console.error(error);
        setUploadSuccess(false);
      });
  };

  const fetchComments = async (postId) => {
    try {
      const commentsRef = collection(database, 'comments');
      const commentsSnapshot = await getDocs(commentsRef);
      const commentsData = [];
      commentsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.postId === postId) {
          commentsData.push({ id: doc.id, ...data });
        }
      });
      setComments(commentsData);

    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postsRef = collection(database, 'posts');
        const postsSnapshot = await getDocs(postsRef);
        const postsData = [];
        postsSnapshot.forEach((doc) => {
          const data = doc.data();
          fetchComments(doc.id);
          postsData.push({ id: doc.id, ...data });
        });
        setData(postsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleComment = async (postId) => {
    if (!user || !commentText) return;

    try {
      await addDoc(collection(database, 'comments'), {
        postId,
        text: commentText,
        authorEmail: user.email,
        authorName: user.displayName,
        timestamp: serverTimestamp(),
      });

      setCommentText('');
      fetchComments(postId);

    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };
  const handleLike = async (postId) => {
    try {
      const postRef = doc(database, 'posts', postId);
      await updateDoc(postRef, {
        likes: arrayUnion(user.uid),
      });

      setLikedPosts([...likedPosts, postId]);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };




  return (
    <>

      <Container maxWidth="xl">
        <CssBaseline />
        <Container maxWidth='md' style={{ height: '350px', padding: '20px', display: 'block', border: '1px solid blue', marginTop: '140px' }}>
          <TextField
            label="Title"
            value={title}
            fullWidth
            onChange={(e) => setTitle(e.target.value)}
          /><br /> <br />
          <TextField
            label="Content"
            multiline
            rows={4}
            fullWidth
            value={content}
            onChange={(e) => setContent(e.target.value)}
          /><br /><br />
          <Button
            component="label"
            color='success'
            variant="outlined"
            href="#file-upload"
            startIcon={<AddPhotoAlternateIcon />}
            type="file"
            onChange={(event) => {
              setImageUpload(event.target.files[0]);
            }}
          >
            <Typography textTransform='lowercase'>upload photo </Typography>
            <VisuallyHiddenInput type="file" />
          </Button>


          <br /><br />
          <Button variant="contained" onClick={uploadFile} disabled={isLoading}>
            {isLoading ? 'Posting...' : 'Post'}
          </Button>
        </Container>
        {uploadSuccess && (
          <div style={{ color: 'green', marginTop: '10px' }}>
            Image uploaded successfully!
          </div>
        )}
      </Container>
    {/*<Typography variant="h4">Uploaded Data</Typography>
        <TextField
          label="Title"
          variant="outlined"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          label="Content"
          variant="outlined"
          fullWidth
          multiline
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageUpload(e.target.files[0])}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={uploadFile}
          startIcon={<SendIcon />}
        >
          Upload
        </Button>
        */}
      <Container maxWidth='md'>
        {data.map((item) => (
          <Card key={item.id} style={{ width: '95%', margin: '10px' }}>
            <CardContent>
              <img
                src={item.imageUrl}
                alt="Blog"
                style={{ maxHeight: '420px', cursor: 'pointer', width: '900px' }}
                onClick={() => handleClickOpen(item.imageUrl)} />
              <Dialog open={open} onClose={handleClose} maxWidth="xs" >
                <DialogContent style={{ overflowY: 'hidden', padding: '0px' }}>
                  {selectedImage && (
                    <>
                      <img src={selectedImage} alt="Full Width" style={{ width: '100%', overflowX: 'hidden', position: 'relative' }} />
                      <IconButton
                        edge="end"
                        color="inherit"
                        onClick={handleClose}
                        aria-label="close"
                        sx={{ position: 'absolute', top: 0, right: 0 }}              >
                        <CloseIcon />
                      </IconButton>
                    </>
                  )}
                </DialogContent>
              </Dialog><br />
              <Typography variant="h6">{item.title}</Typography>
              <Typography variant="body1">{item.content}</Typography>
              {/*   <img src={item.imageUrl} alt="Blog" style={{ width:'100%' ,maxHeight:''}} />*/}

              <Stack direction="row" spacing={1}>
                <Chip label={`Posted by ${item.authorName}`} variant="filled" />
              </Stack><br />
              <div>
                {comments
                  .filter((comment) => comment.postId === item.id)
                  .map((comment) => (
                    <div key={comment.id}>
                      <p>{comment.text}</p>
                      <Typography variant="caption">
                        Comment by: {comment.authorName}
                      </Typography>
                    </div>
                  ))}
              </div>
              {user && (
                <div>
                  <TextField
                    label="Add a comment"
                    variant="outlined"
                    fullWidth
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <br/>  <br/>
                  <IconButton
                    color={likedPosts.includes(item.id) ? 'secondary' : 'default'}
                    onClick={() => handleLike(item.id)}
                  >
                    <FavoriteIcon />
                  </IconButton>
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<SendIcon />}
                    onClick={() => handleComment(item.id)}
                  >
                    Comment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}


        {data.map((item) => (
          <Card key={item.id} style={{ margin: '10px 0' }}>
            <CardContent>
              <Typography variant="h6">{item.title}</Typography>
              <Typography variant="body1">{item.content}</Typography>
              <img src={item.imageUrl} alt='ok' style={{ height: '350' }} />
            </CardContent>
          </Card>
        ))}
      </Container>
    </>
  );
};

export default Home;


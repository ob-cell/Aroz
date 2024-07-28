// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC4smb-b2Reca8zWgQUAR-HRuX6AVDek3A",
     authDomain: "yana-8db16.firebaseapp.com",
    databaseURL: "https://yana-8db16-default-rtdb.firebaseio.com",
    projectId: "yana-8db16",
    storageBucket: "yana-8db16.appspot.com",
    messagingSenderId: "219420809787",
    appId: "1:219420809787:web:399d0a4c274539a0afda1e",
    measurementId: "G-Z055VEKXM0"
  };
  firebase.initializeApp(firebaseConfig);

  const auth = firebase.auth();
  const db = firebase.firestore();

  const signInButton = document.getElementById('signInButton');
  const signOutButton = document.getElementById('signOutButton');
  const chatSection = document.getElementById('chatSection');
  const messageArea = document.getElementById('messageArea');
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');

  signInButton.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => {
      console.error("Error during sign in:", error);
      alert("Sign in failed. Please check console for details.");
    });
  };
  signOutButton.onclick = () => auth.signOut();

  auth.onAuthStateChanged(user => {
    if (user) {
      console.log("User signed in:", user.displayName);
      signInButton.style.display = 'none';
      signOutButton.style.display = 'inline-block';
      chatSection.style.display = 'flex';
      sendMessage.style.display = 'block';
      loadMessages();
    } else {
      console.log("User signed out");
      signInButton.style.display = 'inline-block';
      signOutButton.style.display = 'none';
      chatSection.style.display = 'none';
      sendMessage.style.display = 'none';
    }
  });

  // Function to format timestamp
  function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000); // Convert Firestore timestamp to JavaScript Date

    const optionsDate = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZoneName: 'short'
    };
    const optionsTime = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };

    const formattedDate = new Intl.DateTimeFormat('en-GB', optionsDate).format(date);
    const formattedTime = new Intl.DateTimeFormat('en-GB', optionsTime).format(date);

    // Split formattedDate into parts
    const [weekday, day, month, year] = formattedDate.split(' ');

    // Construct the desired format
    return `${weekday}, ${day} ${month} ${year} | ${formattedTime}`;
  }

  // Function to get YouTube Video ID
  function getYouTubeVideoId(url) {
    const pattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(pattern);
    return match ? match[1] : null;
  }

  // Function to convert newline characters to <br> tags
  function nl2br(text) {
    return text.replace(/\n/g, '<br>');
  }

  // Function to format URLs and add <br> tags
  function formatMessageText(text) {
    const urlPattern = /\bhttps?:\/\/\S+/gi;
    let formattedText = text.replace(urlPattern, (url) => {
      // Check if the URL is an image
      if (/\.(png|jpg|jpeg|webp|gif|svg)$/i.test(url)) {
        return `<a href="${url}" target="_blank"><img class="w-100 rounded-4" loading="lazy" src="${url}" alt="Image"></a>`;
      }
      // Check if the URL is a YouTube link
      const videoId = getYouTubeVideoId(url);
      if (videoId) {
        return `<div class="w-100 overflow-hidden position-relative ratio ratio-16x9 rounded-4"><iframe loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" class="rounded-4 position-absolute top-0 bottom-0 start-0 end-0 w-100 h-100 border-0" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
      }
      // Default case for plain URLs
      return `<a href="${url}" target="_blank">${url}</a>`;
    });
    // Convert newline characters to <br> tags
    formattedText = nl2br(formattedText);
    return formattedText;
  }

  function loadMessages() {
    db.collection('messages').orderBy('timestamp', 'asc').limit(200).onSnapshot(snapshot => {
      messageArea.innerHTML = '';
      snapshot.docs.forEach(doc => {
        const message = doc.data();
        const isUser = message.sender === auth.currentUser.displayName;
        const formattedText = formatMessageText(message.text);
        const messageElement = document.createElement('div');
        messageElement.className = `card p-3 border-0 my-2 message ${isUser ? 'text-align-right ms-auto bg-light-subtle rounded-top-0 rounded-start-4 rounded-bottom-4' : 'text-align-left me-auto bg-secondary-subtle rounded-top-0 rounded-end-4 rounded-bottom-4'}`;

        messageElement.innerHTML = `
            <div class="message-container">
              <div class="position-relative">
                ${isUser ? `
                  <div class="dropdown position-absolute top-0 end-0">
                    <button class="btn btn-sm border-0 p-0" type="button" id="dropdownMenuButton${doc.id}" data-bs-toggle="dropdown" aria-expanded="false"><i class="bi bi-three-dots-vertical text-white"></i></button>
                    <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton${doc.id}">
                      <li><a class="dropdown-item delete-btn" onclick="deleteMessage('${doc.id}')">Delete</a></li>
                    </ul>
                  </div>
                ` : ''}
                <h6 class="fw-bold mb-4">${message.sender}</h6>
                <p>${formattedText}</p>
                <h6 class="small mt-4 ${isUser ? 'text-start' : 'text-end'}"><small>${formatTimestamp(message.timestamp)}</small></h6>
              </div>
            </div>
          `;

        messageArea.appendChild(messageElement);
      });
      messageArea.scrollTop = messageArea.scrollHeight;
    });
  }

  function deleteMessage(messageId) {
    db.collection('messages').doc(messageId).delete().then(() => {
      console.log("Message successfully deleted!");
    }).catch((error) => {
      console.error("Error removing message: ", error);
    });
  }

  sendButton.onclick = () => {
    if (messageInput.value.trim()) {
      db.collection('messages').add({
        text: messageInput.value,
        sender: auth.currentUser.displayName,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        messageInput.value = '';
      }).catch(error => {
        console.error("Error sending message:", error);
      });
    }
  };

  // to modify (enter to send a message, doesn't work properly)

input.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("sendButton").click();
  }
});

// Emoji picker
$(document).ready(function() {
    $("#messageInput").emojioneArea();
})

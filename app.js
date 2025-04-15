// Имитация базы данных
const feedbackDB = {
    storage: localStorage.getItem('feedbackDB') ? JSON.parse(localStorage.getItem('feedbackDB')) : [],
    
    // Добавить отзыв
    addFeedback: function(feedback) {
        this.storage.push(feedback);
        localStorage.setItem('feedbackDB', JSON.stringify(this.storage));
    },
    
    // Получить все отзывы
    getFeedbacks: function() {
        return this.storage;
    },
    
    // Очистить базу (для тестов)
    clearDB: function() {
        this.storage = [];
        localStorage.setItem('feedbackDB', JSON.stringify(this.storage));
    }
};

// Telegram WebApp integration
const tgWebApp = {
    isTelegram: false,
    user: null,
    
    init: function() {
        if (window.Telegram && window.Telegram.WebApp) {
            this.isTelegram = true;
            window.Telegram.WebApp.expand();
            this.user = window.Telegram.WebApp.initDataUnsafe?.user;
            
            if (this.user) {
                console.log('User authenticated via Telegram:', this.user);
                document.getElementById('auth-warning').style.display = 'none';
            } else {
                console.log('User not authenticated');
                document.getElementById('auth-warning').style.display = 'block';
            }
        } else {
            console.log('Not in Telegram WebApp');
            document.getElementById('auth-warning').style.display = 'block';
        }
    },
    
    getUserData: function() {
        if (this.user) {
            return {
                id: this.user.id,
                username: this.user.username || `user_${this.user.id}`,
                firstName: this.user.first_name,
                lastName: this.user.last_name,
                avatar: this.user.photo_url || `https://ui-avatars.com/api/?name=${this.user.first_name}+${this.user.last_name}&background=random`
            };
        }
        return null;
    }
};

// UI Controller
const appController = {
    init: function() {
        tgWebApp.init();
        this.setBackgroundVideo();
        this.setupEventListeners();
        this.checkAuth();
    },
    
    setBackgroundVideo: function() {
        const videoElement = document.getElementById('bg-video');
        const sourceElement = document.getElementById('video-source');
        
        // Для мобильных - вертикальное видео
        if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            sourceElement.src = 'assets/video/mobile-bg.mp4';
        } else {
            sourceElement.src = 'assets/video/desktop-bg.mp4';
        }
        
        videoElement.load();
    },
    
    setupEventListeners: function() {
        document.getElementById('view-feedback-btn').addEventListener('click', () => this.showFeedbackList());
        document.getElementById('add-feedback-btn').addEventListener('click', () => this.showFeedbackForm());
        document.getElementById('back-to-main-btn').addEventListener('click', () => this.showMainMenu());
        document.getElementById('cancel-feedback-btn').addEventListener('click', () => this.showMainMenu());
        document.getElementById('submit-feedback-btn').addEventListener('click', () => this.submitFeedback());
    },
    
    checkAuth: function() {
        if (!tgWebApp.isTelegram || !tgWebApp.user) {
            document.getElementById('add-feedback-btn').addEventListener('click', (e) => {
                if (!tgWebApp.user) {
                    e.preventDefault();
                    alert('Для оставления отзыва войдите через Telegram!');
                }
            });
        }
    },
    
    showMainMenu: function() {
        document.getElementById('main-menu').style.display = 'block';
        document.getElementById('feedback-container').style.display = 'none';
        document.getElementById('feedback-form').style.display = 'none';
    },
    
    showFeedbackList: function() {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('feedback-container').style.display = 'block';
        document.getElementById('feedback-form').style.display = 'none';
        
        this.loadFeedbacks();
    },
    
    showFeedbackForm: function() {
        if (!tgWebApp.user) {
            alert('Для оставления отзыва войдите через Telegram!');
            return;
        }
        
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('feedback-container').style.display = 'none';
        document.getElementById('feedback-form').style.display = 'block';
        
        const user = tgWebApp.getUserData();
        if (user) {
            document.getElementById('form-user-avatar').src = user.avatar;
            document.getElementById('form-username').textContent = `@${user.username}`;
        }
        
        document.querySelector('textarea').focus();
    },
    
    loadFeedbacks: function() {
        const feedbackList = document.getElementById('feedback-list');
        feedbackList.innerHTML = '';
        
        const feedbacks = feedbackDB.getFeedbacks();
        
        if (feedbacks.length === 0) {
            feedbackList.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6);">Пока нет отзывов. Будьте первым!</p>';
            return;
        }
        
        feedbacks.reverse().forEach(feedback => {
            const feedbackItem = document.createElement('div');
            feedbackItem.className = 'feedback-item';
            feedbackItem.innerHTML = `
                <div class="user-info">
                    <img src="${feedback.user.avatar}" alt="${feedback.user.username}" class="user-avatar">
                    <span class="username">@${feedback.user.username}</span>
                </div>
                <p class="feedback-text">${feedback.text}</p>
                <div class="feedback-date">${new Date(feedback.date).toLocaleString()}</div>
            `;
            feedbackList.appendChild(feedbackItem);
        });
    },
    
    submitFeedback: function() {
        const textarea = document.querySelector('textarea');
        const feedbackText = textarea.value.trim();
        
        if (!feedbackText) {
            alert('Пожалуйста, введите текст отзыва');
            return;
        }
        
        const user = tgWebApp.getUserData();
        if (!user) {
            alert('Ошибка авторизации');
            return;
        }
        
        const newFeedback = {
            user: {
                id: user.id,
                username: user.username,
                avatar: user.avatar
            },
            text: feedbackText,
            date: new Date().toISOString()
        };
        
        feedbackDB.addFeedback(newFeedback);
        textarea.value = '';
        
        alert('Спасибо за ваш отзыв!');
        this.showFeedbackList();
    }
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    appController.init();
});

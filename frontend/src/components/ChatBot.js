// src/components/ChatBot.js

import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const BUBBLE_MESSAGES = [
  '오늘의 메뉴를 물어보세요! ☕',
  'AI가 메뉴를 추천해드려요 🎯',
  '궁금한 것을 물어보세요! 💬',
];

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [bubbleIdx,     setBubbleIdx]     = useState(0);
  const [bubbleVisible, setBubbleVisible] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: '안녕하세요! 🍵\nBREWY 메뉴 추천 AI예요!\n오늘 어떤 음료 드시고 싶으세요?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) return;
    const timer = setInterval(() => {
      setBubbleVisible(false);
      setTimeout(() => {
        setBubbleIdx(prev => (prev + 1) % BUBBLE_MESSAGES.length);
        setBubbleVisible(true);
      }, 350);
    }, 3500);
    return () => clearInterval(timer);
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 내 메시지 추가
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // 백엔드 AI API 호출
      const res = await api.post(
        '/api/ai/recommend',
        { message: input }
      );

      setMessages(prev => [...prev, {
        role: 'bot',
        text: res.data.reply
      }]);

    } catch (err) {
      // OpenAI 크레딧 없을 때
      // 임시로 더미 응답!
      const dummyReply = getDummyReply(input);
      setMessages(prev => [...prev, {
        role: 'bot',
        text: dummyReply
      }]);
    } finally {
      setLoading(false);
    }
  };

  // OpenAI 없을 때 임시 응답!
  const getDummyReply = (msg) => {
    if (msg.includes('피곤') ||
        msg.includes('졸')) {
      return '피곤하실 때는 ☕ 아메리카노 (4,500원)를 추천드려요!\n진한 에스프레소로 활력을 되찾아보세요!';
    } else if (msg.includes('달') ||
               msg.includes('달달')) {
      return '달달한 걸 좋아하신다면\n🍵 바닐라라떼 (5,500원)나\n🍰 티라미수 (5,500원)는 어떠세요?';
    } else if (msg.includes('차') ||
               msg.includes('녹차')) {
      return '차 종류를 좋아하신다면\n🍵 그린티라떼 (5,500원)를 추천드려요!\n국산 말차로 만든 진한 라떼예요!';
    } else if (msg.includes('디저트')) {
      return '디저트로는\n🥐 크로플 (4,000원) - 바삭한 크로플\n🍰 티라미수 (5,500원) - 이탈리안 디저트\n두 가지가 있어요!';
    } else {
      return '오늘의 추천 메뉴는\n☕ 카페라떼 (5,000원)예요!\n부드러운 우유와 에스프레소의\n완벽한 조화를 느껴보세요! 😊';
    }
  };

  return (
    <>
      {/* 말풍선 알림 */}
      {!isOpen && (
        <div style={{
          ...styles.bubble,
          opacity:   bubbleVisible ? 1 : 0,
          transform: bubbleVisible ? 'translateX(0)' : 'translateX(8px)',
        }}>
          {BUBBLE_MESSAGES[bubbleIdx]}
          <div style={styles.bubbleTail} />
        </div>
      )}

      {/* 챗봇 버튼 */}
      <button
        style={styles.chatBtn}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕' : '☕'}
      </button>

      {/* 채팅 팝업 */}
      {isOpen && (
        <div style={styles.chatBox}>

          {/* 헤더 */}
          <div style={styles.chatHeader}>
            <span>☕ BREWY AI 메뉴 추천</span>
            <button
              style={styles.closeBtn}
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* 메시지 목록 */}
          <div style={styles.messageList}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.message,
                  alignSelf: msg.role === 'user'
                    ? 'flex-end'
                    : 'flex-start',
                  backgroundColor:
                    msg.role === 'user'
                      ? '#6f4e37'
                      : 'white',
                  color: msg.role === 'user'
                    ? 'white'
                    : '#333'
                }}
              >
                {msg.text.split('\n').map(
                  (line, i) => (
                    <span key={i}>
                      {line}<br/>
                    </span>
                  )
                )}
              </div>
            ))}

            {/* 로딩 */}
            {loading && (
              <div style={{
                ...styles.message,
                alignSelf: 'flex-start',
                backgroundColor: 'white'
              }}>
                생각중... 🤔
              </div>
            )}
          </div>

          {/* 빠른 질문 버튼들 */}
          <div style={styles.quickBtns}>
            {[
              '피곤할 때 추천',
              '달달한거 먹고 싶어',
              '디저트 추천',
              '차 종류 있어?'
            ].map((q, idx) => (
              <button
                key={idx}
                style={styles.quickBtn}
                onClick={() => {
                  setInput(q);
                }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* 입력창 */}
          <div style={styles.inputArea}>
            <input
              style={styles.chatInput}
              placeholder="메뉴 추천 받기..."
              value={input}
              onChange={e =>
                setInput(e.target.value)
              }
              onKeyPress={e =>
                e.key === 'Enter' && handleSend()
              }
            />
            <button
              style={styles.sendBtn}
              onClick={handleSend}
            >
              전송
            </button>
          </div>

        </div>
      )}
    </>
  );
}

const styles = {
  bubble: {
    position: 'fixed',
    bottom: '44px',
    right: '104px',
    backgroundColor: '#6F4E37',
    color: 'white',
    padding: '10px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 16px rgba(111,78,55,0.30)',
    zIndex: 1000,
    transition: 'opacity 0.35s ease, transform 0.35s ease',
    pointerEvents: 'none',
  },
  bubbleTail: {
    position: 'absolute',
    right: '-7px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 0,
    height: 0,
    borderTop: '6px solid transparent',
    borderBottom: '6px solid transparent',
    borderLeft: '8px solid #6F4E37',
  },
  chatBtn: {
    position: 'fixed',
    bottom: '32px',
    right: '32px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#6f4e37',
    color: 'white',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    zIndex: 1000
  },
  chatBox: {
    position: 'fixed',
    bottom: '100px',
    right: '32px',
    width: '360px',
    height: '500px',
    backgroundColor: '#f9f9f9',
    borderRadius: '16px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    overflow: 'hidden'
  },
  chatHeader: {
    backgroundColor: '#6f4e37',
    color: 'white',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: 'bold'
  },
  closeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px'
  },
  messageList: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  message: {
    maxWidth: '80%',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '14px',
    lineHeight: '1.5',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
  },
  quickBtns: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    padding: '8px 16px'
  },
  quickBtn: {
    padding: '4px 10px',
    backgroundColor: '#f0e6d3',
    color: '#6f4e37',
    border: 'none',
    borderRadius: '20px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  inputArea: {
    display: 'flex',
    padding: '12px 16px',
    gap: '8px',
    borderTop: '1px solid #eee',
    backgroundColor: 'white'
  },
  chatInput: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none'
  },
  sendBtn: {
    padding: '10px 16px',
    backgroundColor: '#6f4e37',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default ChatBot;

//AI Generate:parkynh2|20260520|286|
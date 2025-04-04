import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label as UILabel } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Target, 
  Trophy, 
  Clock as ClockIcon, 
  Star, 
  Award,
  ChevronRight,
  CheckCircle,
  Circle,
  RotateCw,
  Video,
  VideoOff,
  Settings,
  Upload,
  Mic,
  MicOff
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Hands, Results, NormalizedLandmarkListList, Handedness } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

// Game-related types
type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  total: number;
  reward: number;
  unlocked: boolean;
};

type Challenge = {
  id: string;
  title: string;
  description: string;
  gestures: string[];
  timeLimit: number;
  reward: number;
  completed: boolean;
};

// Type definitions for MediaPipe results
type HandResults = {
  multiHandLandmarks: NormalizedLandmarkListList;
  multiHandedness: Handedness[];
};

// Extend the Results type from MediaPipe
declare module "@mediapipe/hands" {
  interface Results {
    multiHandLandmarks: NormalizedLandmarkListList;
    multiHandedness: Handedness[];
  }
}

// Add learning path types
type LearningPath = {
  id: string;
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: Lesson[];
  completed: boolean;
  progress: number;
};

type Lesson = {
  id: string;
  title: string;
  description: string;
  gestures: string[];
  duration: number; // in minutes
  completed: boolean;
  score: number;
  attempts: number;
};

type UserProgress = {
  currentPath: string;
  completedLessons: string[];
  totalPracticeTime: number;
  accuracy: number;
  streak: number;
  achievements: string[];
  level: number;
  experience: number;
};

type GestureAverages = {
  [key: string]: number[];
};

type TrainingData = {
  gesture: string;
  distances: Record<string, number>;
};

const SignLanguageTranslator = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cameraSettings, setCameraSettings] = useState({
    brightness: 50,
    contrast: 50,
    mirror: true,
    continuousTranslation: true
  });
  const [handModel, setHandModel] = useState<Hands | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [lastGesture, setLastGesture] = useState<string | null>(null);
  const [gestureTimeout, setGestureTimeout] = useState<NodeJS.Timeout | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const translationTimeoutRef = useRef<NodeJS.Timeout>();
  const cameraRef = useRef<Camera | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedGestures, setDetectedGestures] = useState<string[]>([]);
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [lastGestureTime, setLastGestureTime] = useState<number>(0);
  const GESTURE_DEBOUNCE_TIME = 1000; // 1 second debounce time
  const MIN_GESTURE_DURATION = 500; // Minimum time a gesture must be held
  const [isModelInitialized, setIsModelInitialized] = useState(false);
  const modelRef = useRef<Hands | null>(null);
  const [translationHistory, setTranslationHistory] = useState<Array<{
    text: string;
    gestures: string[];
    timestamp: Date;
  }>>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [currentTrainingGesture, setCurrentTrainingGesture] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "first_gesture",
      title: "First Steps",
      description: "Successfully detect your first gesture",
      icon: <Star className="w-4 h-4" />,
      progress: 0,
      total: 1,
      reward: 10,
      unlocked: false
    },
    {
      id: "gesture_master",
      title: "Gesture Master",
      description: "Detect 50 gestures correctly",
      icon: <Trophy className="w-4 h-4" />,
      progress: 0,
      total: 50,
      reward: 50,
      unlocked: false
    },
    {
      id: "perfect_streak",
      title: "Perfect Streak",
      description: "Maintain a streak of 10 correct gestures",
      icon: <Star className="w-4 h-4" />,
      progress: 0,
      total: 10,
      reward: 30,
      unlocked: false
    }
  ]);

  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: "hello_world",
      title: "Hello World",
      description: "Perform the 'Hello' gesture 5 times",
      gestures: ["A"],
      timeLimit: 60,
      reward: 20,
      completed: false
    },
    {
      id: "basic_phrases",
      title: "Basic Phrases",
      description: "Perform 'Hello', 'Thank you', and 'Please' in sequence",
      gestures: ["A", "B", "C"],
      timeLimit: 90,
      reward: 30,
      completed: false
    }
  ]);

  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [challengeTimer, setChallengeTimer] = useState<number | null>(null);
  const [challengeProgress, setChallengeProgress] = useState<string[]>([]);
  const [handResults, setHandResults] = useState<HandResults | null>(null);

  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([
    {
      id: "basic-communication",
      title: "Basic Communication",
      description: "Learn essential signs for everyday communication",
      level: "beginner",
      completed: false,
      progress: 0,
      lessons: [
        {
          id: "greetings",
          title: "Greetings",
          description: "Learn basic greeting signs",
          gestures: ["A", "B", "C"],
          duration: 10,
          completed: false,
          score: 0,
          attempts: 0
        },
        {
          id: "common-phrases",
          title: "Common Phrases",
          description: "Essential phrases for daily conversation",
          gestures: ["D", "E", "F"],
          duration: 15,
          completed: false,
          score: 0,
          attempts: 0
        }
      ]
    },
    {
      id: "advanced-conversation",
      title: "Advanced Conversation",
      description: "Master complex conversations in sign language",
      level: "intermediate",
      completed: false,
      progress: 0,
      lessons: [
        {
          id: "emotions",
          title: "Expressing Emotions",
          description: "Learn to express feelings and emotions",
          gestures: ["G", "H", "I"],
          duration: 20,
          completed: false,
          score: 0,
          attempts: 0
        },
        {
          id: "storytelling",
          title: "Storytelling",
          description: "Learn to tell stories in sign language",
          gestures: ["J", "K", "L"],
          duration: 25,
          completed: false,
          score: 0,
          attempts: 0
        }
      ]
    }
  ]);

  const [userProgress, setUserProgress] = useState<UserProgress>({
    currentPath: "basic-communication",
    completedLessons: [],
    totalPracticeTime: 0,
    accuracy: 0,
    streak: 0,
    achievements: [],
    level: 1,
    experience: 0
  });

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [lessonProgress, setLessonProgress] = useState(0);

  // Sample sign language phrases for demo
  const demoSignPhrases = [
    "Hello, how are you?",
    "Nice to meet you",
    "Thank you",
    "I need help",
    "Good morning",
    "My name is...",
  ];

  // Update gesture to text mappings
  const gestureToText = {
    "A": "Hello",
    "B": "Thank you",
    "C": "Please",
    "D": "Goodbye",
    "E": "Yes",
    "F": "No",
    "G": "Help",
    "H": "Water",
    "I": "Food",
    "J": "Bathroom"
  };

  const gestureSequences = {
    "AB": "Hello, thank you",
    "BC": "Thank you, please",
    "CD": "Please, goodbye",
    "ABC": "Hello, thank you, please",
    "BCD": "Thank you, please, goodbye",
    "ABCD": "Hello, thank you, please, goodbye",
    "AE": "Hello, yes",
    "AF": "Hello, no",
    "AG": "Hello, help",
    "AH": "Hello, water",
    "AI": "Hello, food",
    "AJ": "Hello, bathroom"
  };

  // Remove dummy paragraphs
  const dummyParagraphs = [
    "Hello! Welcome to the sign language translator. This is a test paragraph for text-to-speech functionality.",
    "The quick brown fox jumps over the lazy dog. This is a classic pangram that contains every letter of the English alphabet.",
    "Sign language is a beautiful way to communicate. It uses hand gestures, facial expressions, and body movements to convey meaning.",
    "Technology has made great strides in helping people with hearing impairments communicate more effectively with others.",
    "This translator aims to bridge the gap between sign language and spoken language, making communication more accessible for everyone."
  ];

  const [gestureAverages, setGestureAverages] = useState<GestureAverages>({});
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize MediaPipe Hands model
  useEffect(() => {
    let hands: Hands | null = null;

    const initializeModel = async () => {
      try {
        hands = new Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results: Results) => {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            setHandResults({
              multiHandLandmarks: results.multiHandLandmarks,
              multiHandedness: results.multiHandedness || []
            });
            const landmarks = results.multiHandLandmarks[0];
            const gesture = detectGesture(landmarks);
            
            if (gesture && gesture !== currentGesture) {
              setCurrentGesture(gesture);
              setDetectedGestures(prev => [...prev, gesture]);
              
              // Update translation based on detected gestures
              const translation = getTranslationFromGestures([...detectedGestures, gesture]);
              setTranslatedText(translation);
            }
          } else {
            setHandResults(null);
          }
        });

        await hands.initialize();
        modelRef.current = hands;
        setHandModel(hands);
        setIsModelInitialized(true);
        console.log('MediaPipe Hands model initialized successfully');
      } catch (error) {
        console.error('Error initializing MediaPipe Hands model:', error);
        setModelError('Failed to initialize hand detection model. Please refresh the page and try again.');
      }
    };

    initializeModel();

    return () => {
      if (hands) {
        try {
          hands.close();
          modelRef.current = null;
          setHandModel(null);
          setIsModelInitialized(false);
        } catch (error) {
          console.error('Error closing MediaPipe Hands model:', error);
        }
      }
    };
  }, []);

  useEffect(() => {
    // Cleanup function to stop camera and animation frame when component unmounts
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }
    };
  }, []);

  const processVideoFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !handModel) {
      if (!handModel) {
        setDebugInfo("Hand model not loaded yet");
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Clear previous frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Send frame to MediaPipe Hands model
      await handModel.send({ image: video });

      // Draw landmarks if available
      if (handResults?.multiHandLandmarks) {
        handResults.multiHandLandmarks.forEach((landmarks) => {
          // Draw connections
          ctx.beginPath();
          ctx.strokeStyle = '#00FF00';
          ctx.lineWidth = 2;
          
          // Draw lines between landmarks
          for (let i = 0; i < landmarks.length - 1; i++) {
            const start = landmarks[i];
            const end = landmarks[i + 1];
            ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
            ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
          }
          ctx.stroke();

          // Draw landmarks
          ctx.fillStyle = '#FF0000';
          landmarks.forEach((landmark) => {
            ctx.beginPath();
            ctx.arc(
              landmark.x * canvas.width,
              landmark.y * canvas.height,
              3,
              0,
              2 * Math.PI
            );
            ctx.fill();
          });
        });
      }
    } catch (error) {
      console.error('Error processing video frame:', error);
      setDebugInfo(`Error: ${error.message}`);
    }

    // Continue processing frames
    animationFrameRef.current = requestAnimationFrame(processVideoFrame);
  };

  const processHandLandmarks = (landmarks: any[]) => {
    if (!handDetected) return;

    const currentTime = Date.now();
    const gesture = detectGesture(landmarks);

    if (gesture) {
      // Check if enough time has passed since the last gesture
      if (currentTime - lastGestureTime >= GESTURE_DEBOUNCE_TIME) {
        setLastGestureTime(currentTime);
        
        // Update game features
        updateAchievements(gesture);
        updateStreak(true);
        if (activeChallenge) {
          checkChallengeProgress(gesture);
        }

        // Update learning progress
        if (practiceMode && activeLesson) {
          const isCorrect = activeLesson.gestures.includes(gesture);
          updateUserProgress(gesture, isCorrect);
          
          // Update lesson progress
          const gestureIndex = activeLesson.gestures.indexOf(gesture);
          if (gestureIndex !== -1) {
            setLessonProgress(prev => {
              const newProgress = prev + (100 / activeLesson.gestures.length);
              if (newProgress >= 100) {
                completeLesson(newProgress);
              }
              return newProgress;
            });
          }
        }

        // Clear any existing timeout
        if (gestureTimeoutRef.current) {
          clearTimeout(gestureTimeoutRef.current);
        }

        // Set new timeout to clear the gesture
        gestureTimeoutRef.current = setTimeout(() => {
          setCurrentGesture(null);
        }, GESTURE_DEBOUNCE_TIME);

        setCurrentGesture(gesture);
        setDetectedGestures(prev => [...prev, gesture]);
        
        // Update translation based on detected gestures
        const translation = getTranslationFromGestures([...detectedGestures, gesture]);
        setTranslatedText(translation);
      }
    } else {
      updateStreak(false);
      // If no specific gesture is detected but hand is present
      setTranslatedText("Hand detected - Try making a gesture!");
    }

    setDebugInfo(JSON.stringify(gestureAverages, null, 2));
  };

  const toggleCamera = async () => {
    console.log('Camera button clicked');
    
    if (!cameraEnabled) {
      try {
        console.log('Attempting to enable camera...');
        
        // First check if mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.error('MediaDevices API not supported');
          throw new Error('MediaDevices API not supported in this browser');
        }

        // Try with simpler constraints first
        const constraints = {
          video: {
            facingMode: "user",
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 }
          },
          audio: false
        };

        console.log('Requesting camera with constraints:', constraints);
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!stream) {
          console.error('Failed to get media stream');
          throw new Error('Failed to get media stream');
        }

        console.log('Camera stream obtained successfully');
        
        // Set camera enabled first to trigger re-render
        setCameraEnabled(true);
        
        // Wait for the next render cycle to ensure video element is mounted
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!videoRef.current) {
          console.error('Video element not found in DOM');
          throw new Error('Video element not found in DOM');
        }

        console.log('Setting up video element');
        const video = videoRef.current;
        
        // Set up video element
        video.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          const handleLoadedMetadata = () => {
            console.log('Video metadata loaded');
            video.play()
              .then(() => {
                console.log('Video started playing');
                video.removeEventListener('loadedmetadata', handleLoadedMetadata);
                resolve(true);
              })
              .catch(err => {
                console.error('Error playing video:', err);
                reject(err);
              });
          };
          
          video.addEventListener('loadedmetadata', handleLoadedMetadata);
          
          // Add error handler
          video.onerror = (err) => {
            console.error('Video element error:', err);
            reject(err);
          };
        });

        streamRef.current = stream;
        // Start processing video frames
        processVideoFrame();
      } catch (error) {
        console.error("Error accessing camera:", error);
        let errorMessage = "Cannot access camera. ";
        
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            errorMessage += "Please check camera permissions in your browser settings.";
          } else if (error.name === 'NotFoundError') {
            errorMessage += "No camera found on your device.";
          } else if (error.name === 'NotReadableError') {
            errorMessage += "Camera is already in use by another application.";
          } else {
            errorMessage += error.message;
          }
        }
        
        alert(errorMessage);
        setCameraEnabled(false);
        
        // Clean up if there was an error
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      }
    } else {
      console.log('Disabling camera...');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        setCameraEnabled(false);
        setIsRecording(false); // Also stop recording when disabling camera
      }
    }
  };

  const startTranslation = () => {
    if (!cameraEnabled) {
      console.log('Camera not enabled, enabling first...');
      toggleCamera();
      return;
    }

    console.log('Starting translation...');
    setIsRecording(true);
    setTranslatedText("Waiting for hand detection..."); // Initial message
    
    // Start processing frames
    if (videoRef.current && canvasRef.current) {
      console.log('Starting frame processing');
      processVideoFrame();
    } else {
      console.log('Video or canvas not available');
    }

    // If continuous translation is disabled, simulate a single translation
    if (!cameraSettings.continuousTranslation) {
      console.log('Single translation mode');
      translationTimeoutRef.current = setTimeout(() => {
        const randomPhrase = demoSignPhrases[Math.floor(Math.random() * demoSignPhrases.length)];
        console.log('Adding single phrase:', randomPhrase);
        setTranslatedText(randomPhrase);
        setIsRecording(false);
      }, 2000);
    }
  };

  const stopTranslation = () => {
    setIsRecording(false);
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current);
    }
  };

  const speakText = () => {
    if (!translatedText) return;
    
    setIsSpeaking(true);
    
    // Using Web Speech API for simple demo purposes
    const speech = new SpeechSynthesisUtterance(translatedText);
    speech.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(speech);
  };

  const clearTranslation = () => {
    setTranslatedText("");
    setDetectedGestures([]);
    setCurrentGesture(null);
    setLastGesture(null);
    // Don't clear translation history
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      if (gestureTimeout) {
        clearTimeout(gestureTimeout);
      }
    };
  }, [gestureTimeout]);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedVideo(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setTranslatedText("Video uploaded successfully. Click 'Process Video' to start translation.");
    }
  };

  const processUploadedVideo = async () => {
    if (!videoUrl || !uploadedVideo || !modelRef.current || !isModelInitialized) {
      console.log('Missing required components:', { 
        videoUrl, 
        uploadedVideo, 
        model: modelRef.current,
        isInitialized: isModelInitialized 
      });
      return;
    }

    setIsProcessing(true);
    setTranslatedText("Processing video...");
    setDetectedGestures([]);
    setCurrentGesture(null);
    setLastGestureTime(0);

    try {
      // Create a video element to process the uploaded video
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve(true);
        };
      });

      // Process video frames
      const processFrame = async () => {
        if (!modelRef.current || !isModelInitialized) {
          console.log('Model not available, stopping processing');
          setIsProcessing(false);
          return;
        }

        try {
          // Send frame to MediaPipe Hands model
          const response = await modelRef.current.send({ image: video });
          const results = response as unknown as Results;
          
          if (results?.multiHandLandmarks?.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const currentTime = Date.now();
            const gesture = detectGesture(landmarks);
            
            if (gesture && currentTime - lastGestureTime >= GESTURE_DEBOUNCE_TIME) {
              setLastGestureTime(currentTime);
              setCurrentGesture(gesture);
              setDetectedGestures(prev => [...prev, gesture]);
              
              // Update translation based on detected gestures
              const translation = getTranslationFromGestures([...detectedGestures, gesture]);
              setTranslatedText(translation);
            }
          }
          
          // Continue processing if video is still playing
          if (!video.paused && !video.ended) {
            requestAnimationFrame(processFrame);
          } else {
            setIsProcessing(false);
            const finalTranslation = getTranslationFromGestures(detectedGestures);
            setTranslatedText(finalTranslation || "Video processing completed. No gestures detected.");
          }
        } catch (error) {
          console.error('Error processing video frame:', error);
          // Don't stop processing on a single frame error
          if (!video.paused && !video.ended) {
            requestAnimationFrame(processFrame);
          } else {
            setIsProcessing(false);
            setTranslatedText("Error processing video frame.");
          }
        }
      };

      // Start processing
      processFrame();
    } catch (error) {
      console.error('Error processing video:', error);
      setIsProcessing(false);
      setTranslatedText("Error processing video.");
    }
  };

  const detectGesture = (landmarks: any[]): string | null => {
    if (!landmarks || landmarks.length === 0) return null;

    // Calculate distances between key points
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const wrist = landmarks[0];

    // Calculate distances
    const thumbIndexDist = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) +
      Math.pow(thumbTip.y - indexTip.y, 2)
    );

    const thumbMiddleDist = Math.sqrt(
      Math.pow(thumbTip.x - middleTip.x, 2) +
      Math.pow(thumbTip.y - middleTip.y, 2)
    );

    // Detect gestures based on distances
    if (thumbIndexDist < 0.1 && thumbMiddleDist < 0.1) {
      return "A"; // Fist
    } else if (thumbIndexDist > 0.2 && thumbMiddleDist < 0.1) {
      return "B"; // Point
    } else if (thumbIndexDist < 0.1 && thumbMiddleDist > 0.2) {
      return "C"; // Peace
    } else if (thumbIndexDist > 0.2 && thumbMiddleDist > 0.2) {
      return "D"; // Open hand
    }

    return null;
  };

  const getTranslationFromGestures = (gestures: string[]): string => {
    const gestureToText: Record<string, string> = {
      "A": "Hello",
      "B": "Thank you",
      "C": "Please",
      "D": "Goodbye",
      "E": "Yes",
      "F": "No",
      "G": "Help",
      "H": "Water",
      "I": "Food",
      "J": "Bathroom"
    };

    const gestureSequences: Record<string, string> = {
      "AB": "Hello, thank you",
      "AC": "Hello, please",
      "AD": "Hello, goodbye",
      "AE": "Hello, yes",
      "AF": "Hello, no"
    };

    // Check for sequences first
    const sequence = gestures.slice(-2).join("");
    if (gestureSequences[sequence]) {
      return gestureSequences[sequence];
    }

    // Return single gesture translation
    const lastGesture = gestures[gestures.length - 1];
    return gestureToText[lastGesture] || "Unknown gesture";
  };

  const clearUploadedVideo = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setUploadedVideo(null);
    setVideoUrl(null);
    setTranslatedText("");
  };

  const startTraining = (gesture: string) => {
    setCurrentTrainingGesture(gesture);
    setIsTraining(true);
    setTrainingData([]);
  };

  const stopTraining = () => {
    setIsTraining(false);
    setCurrentTrainingGesture(null);
    analyzeTrainingData();
  };

  const collectTrainingData = (landmarks: any[]) => {
    if (!isTraining || !currentTrainingGesture) return;

    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const wrist = landmarks[0];

    const distances = {
      thumbToIndex: Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) + 
        Math.pow(thumbTip.y - indexTip.y, 2)
      ),
      indexToMiddle: Math.sqrt(
        Math.pow(indexTip.x - middleTip.x, 2) + 
        Math.pow(indexTip.y - middleTip.y, 2)
      ),
      middleToRing: Math.sqrt(
        Math.pow(middleTip.x - ringTip.x, 2) + 
        Math.pow(middleTip.y - ringTip.y, 2)
      ),
      ringToPinky: Math.sqrt(
        Math.pow(ringTip.x - pinkyTip.x, 2) + 
        Math.pow(ringTip.y - pinkyTip.y, 2)
      ),
      thumbToWrist: Math.abs(thumbTip.y - wrist.y),
      indexToWrist: Math.abs(indexTip.y - wrist.y),
      middleToWrist: Math.abs(middleTip.y - wrist.y)
    };

    setTrainingData(prev => [...prev, {
      gesture: currentTrainingGesture,
      distances
    }]);
  };

  const analyzeTrainingData = () => {
    const averages: GestureAverages = {};
    
    // Calculate averages for each gesture
    trainingData.forEach(data => {
      if (!averages[data.gesture]) {
        averages[data.gesture] = [];
      }
      
      // Calculate average distances
      const distances = Object.values(data.distances);
      const avgDistance = distances.reduce((sum, val) => sum + val, 0) / distances.length;
      averages[data.gesture].push(avgDistance);
    });

    console.log('Training Analysis:', averages);
    setGestureAverages(averages);
    setDebugInfo(JSON.stringify(averages, null, 2));
  };

  // Update achievements
  const updateAchievements = (gesture: string) => {
    setAchievements(prev => prev.map(achievement => {
      if (achievement.unlocked) return achievement;

      let newProgress = achievement.progress;
      if (achievement.id === "first_gesture") {
        newProgress = 1;
      } else if (achievement.id === "gesture_master") {
        newProgress = Math.min(achievement.progress + 1, achievement.total);
      } else if (achievement.id === "perfect_streak") {
        newProgress = Math.min(streak, achievement.total);
      }

      const unlocked = newProgress >= achievement.total;
      if (unlocked && !achievement.unlocked) {
        setScore(prev => prev + achievement.reward);
      }

      return {
        ...achievement,
        progress: newProgress,
        unlocked
      };
    }));
  };

  // Update streak
  const updateStreak = (correct: boolean) => {
    if (correct) {
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
  };

  // Start challenge
  const startChallenge = (challenge: Challenge) => {
    setActiveChallenge(challenge);
    setChallengeProgress([]);
    setChallengeTimer(challenge.timeLimit);
  };

  // Check challenge progress
  const checkChallengeProgress = (gesture: string) => {
    if (!activeChallenge) return;

    const newProgress = [...challengeProgress, gesture];
    setChallengeProgress(newProgress);

    // Check if challenge is completed
    const isCompleted = activeChallenge.gestures.every((g, i) => newProgress[i] === g);
    if (isCompleted) {
      setScore(prev => prev + activeChallenge.reward);
      setChallenges(prev => prev.map(c => 
        c.id === activeChallenge.id ? { ...c, completed: true } : c
      ));
      setActiveChallenge(null);
      setChallengeTimer(null);
    }
  };

  // Update user progress
  const updateUserProgress = (gesture: string, correct: boolean) => {
    setUserProgress(prev => {
      const newProgress = { ...prev };
      
      // Update accuracy
      const totalGestures = prev.totalPracticeTime + 1;
      newProgress.accuracy = ((prev.accuracy * prev.totalPracticeTime) + (correct ? 1 : 0)) / totalGestures;
      newProgress.totalPracticeTime = totalGestures;
      
      // Update streak
      if (correct) {
        newProgress.streak = prev.streak + 1;
      } else {
        newProgress.streak = 0;
      }
      
      // Update experience and level
      const experienceGain = correct ? 10 : 5;
      newProgress.experience += experienceGain;
      
      if (newProgress.experience >= newProgress.level * 100) {
        newProgress.level += 1;
        newProgress.experience = 0;
      }
      
      return newProgress;
    });
  };

  // Start a lesson
  const startLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setPracticeMode(true);
    setLessonProgress(0);
    setTranslatedText(`Practice: ${lesson.title}`);
  };

  // Complete a lesson
  const completeLesson = (score: number) => {
    if (!activeLesson) return;

    setLearningPaths(prev => prev.map(path => {
      if (path.id === userProgress.currentPath) {
        const updatedLessons = path.lessons.map(lesson => {
          if (lesson.id === activeLesson.id) {
            return {
              ...lesson,
              completed: true,
              score: Math.max(lesson.score, score),
              attempts: lesson.attempts + 1
            };
          }
          return lesson;
        });

        const progress = (updatedLessons.filter(l => l.completed).length / updatedLessons.length) * 100;
        const completed = progress === 100;

        return {
          ...path,
          lessons: updatedLessons,
          progress,
          completed
        };
      }
      return path;
    }));

    setUserProgress(prev => ({
      ...prev,
      completedLessons: [...prev.completedLessons, activeLesson.id]
    }));

    setActiveLesson(null);
    setPracticeMode(false);
  };

  // Update progress section UI
  const renderProgressSection = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>User Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <UILabel>Experience Level</UILabel>
                  <div className="px-2 py-1 bg-gray-100 rounded-md">{userProgress.level}</div>
                </div>
                <div className="flex justify-between items-center">
                  <UILabel>Current Streak</UILabel>
                  <div className="px-2 py-1 bg-gray-100 rounded-md">{userProgress.streak} days</div>
                </div>
                <div className="flex justify-between items-center">
                  <UILabel>Total Experience</UILabel>
                  <div className="px-2 py-1 bg-gray-100 rounded-md">{userProgress.experience} XP</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Learning Paths</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {learningPaths.map((path) => (
                  <div key={path.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <UILabel>{path.title}</UILabel>
                      <div className="px-2 py-1 bg-gray-100 rounded-md">
                        {path.progress}% Complete
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${path.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 gradient-heading text-center">Sign Language Translator</h1>
      
      <Tabs defaultValue="camera" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="camera">Live Camera</TabsTrigger>
          <TabsTrigger value="upload">Upload Video</TabsTrigger>
        </TabsList>
        
        <TabsContent value="camera" className="space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-100 relative flex items-center justify-center">
                {isModelLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <div className="text-white text-center">
                      <RotateCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>Loading hand detection model...</p>
                    </div>
                  </div>
                )}

                {modelError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                    <div className="text-white text-center p-4">
                      <p className="text-red-400 mb-2">{modelError}</p>
                      <Button 
                        variant="outline" 
                        className="text-white border-white hover:bg-white/20"
                        onClick={() => window.location.reload()}
                      >
                        Refresh Page
                      </Button>
                    </div>
                  </div>
                )}

                {cameraEnabled ? (
                  <>
                    <video 
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ display: 'block' }}
                    />
                    <canvas 
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                      style={{ display: 'block', opacity: 0.7 }}
                    />
                  </>
                ) : (
                  <div className="text-gray-500 flex flex-col items-center justify-center h-full">
                    <Video className="w-12 h-12 mb-4" />
                    <p>Camera is disabled</p>
                  </div>
                )}
                
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center bg-red-500 text-white py-1 px-3 rounded-full text-sm">
                    <span className="inline-block w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></span>
                    Recording
                  </div>
                )}

                {handDetected && (
                  <div className="absolute top-4 left-4 flex items-center bg-green-500 text-white py-1 px-3 rounded-full text-sm">
                    <span className="inline-block w-3 h-3 bg-white rounded-full mr-2"></span>
                    Hand Detected
                  </div>
                )}

                {cameraEnabled && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 left-4 bg-white/80 hover:bg-white"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                )}

                {debugInfo && (
                  <div className="absolute bottom-4 left-4 bg-black/50 text-white p-2 rounded text-sm">
                    {debugInfo}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {showSettings && cameraEnabled && (
            <Card className="p-4">
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <UILabel>Brightness</UILabel>
                  <Slider
                    value={[cameraSettings.brightness]}
                    onValueChange={([value]) => setCameraSettings(prev => ({ ...prev, brightness: value }))}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <UILabel>Contrast</UILabel>
                  <Slider
                    value={[cameraSettings.contrast]}
                    onValueChange={([value]) => setCameraSettings(prev => ({ ...prev, contrast: value }))}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="mirror-mode"
                    checked={cameraSettings.mirror}
                    onCheckedChange={(checked) => setCameraSettings(prev => ({ ...prev, mirror: checked }))}
                  />
                  <UILabel htmlFor="mirror-mode">Mirror Mode</UILabel>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="continuous-translation"
                    checked={cameraSettings.continuousTranslation}
                    onCheckedChange={(checked) => setCameraSettings(prev => ({ ...prev, continuousTranslation: checked }))}
                  />
                  <UILabel htmlFor="continuous-translation">Continuous Translation</UILabel>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              onClick={toggleCamera}
              variant={cameraEnabled ? "outline" : "default"}
              className={cameraEnabled ? "border-red-500 text-red-500" : ""}
              disabled={isRecording}
            >
              {cameraEnabled ? (
                <>
                  <VideoOff className="w-4 h-4 mr-2" />
                  Disable Camera
                </>
              ) : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Enable Camera
                </>
              )}
            </Button>
            
            {!isRecording ? (
              <Button 
                onClick={startTranslation}
                disabled={!cameraEnabled}
                className="bg-ocean-blue hover:bg-blue-600"
              >
                Start Translation
              </Button>
            ) : (
              <Button 
                onClick={stopTranslation}
                className="bg-red-500 hover:bg-red-600"
              >
                Stop Translation
              </Button>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="upload">
          <Card>
            <CardContent className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {!uploadedVideo ? (
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-1">Drag and drop a video file</p>
                    <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      id="video-upload"
                    />
                    <label
                      htmlFor="video-upload"
                      className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                      Select Video
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <video
                      src={videoUrl || ''}
                      controls
                      className="w-full rounded-lg"
                    />
                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={processUploadedVideo}
                        disabled={isProcessing}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        {isProcessing ? (
                          <>
                            <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Process Video'
                        )}
                      </Button>
                      <Button
                        onClick={clearUploadedVideo}
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-50"
                      >
                        Clear Video
                      </Button>
                    </div>
                    {isProcessing && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">Detected Gestures: {detectedGestures.join(", ")}</p>
                        <p className="text-sm text-gray-600">Current Gesture: {currentGesture || "None"}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Supported formats: MP4, MOV, AVI (max 100MB)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Translation Results */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Translation Results</h2>
          <div className="bg-gray-50 p-4 rounded-md min-h-20 mb-4">
            {translatedText ? (
              <div className="space-y-2">
                <p className="text-gray-800 text-lg">{translatedText}</p>
                {detectedGestures.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Detected Gestures: {detectedGestures.join(" → ")}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-400 italic">Translation will appear here...</p>
            )}
          </div>
          
          {/* Translation History */}
          {translationHistory.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Translation History</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {translationHistory.map((item, index) => (
                  <div key={index} className="bg-white p-3 rounded-md border">
                    <p className="text-gray-800">{item.text}</p>
                    <p className="text-sm text-gray-500">
                      Gestures: {item.gestures.join(" → ")}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 mt-4">
            <Button 
              onClick={speakText}
              disabled={!translatedText || isSpeaking}
              className="bg-purple hover:bg-purple/90"
            >
              {isSpeaking ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Speaking...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Speak Text
                </>
              )}
            </Button>
            <Button 
              onClick={clearTranslation}
              variant="outline"
              disabled={!translatedText}
            >
              Clear Current
            </Button>
            {translationHistory.length > 0 && (
              <Button 
                onClick={() => setTranslationHistory([])}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50"
              >
                Clear History
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Training Controls */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Gesture Training</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {Object.keys(gestureToText).map(gesture => (
                <Button
                  key={gesture}
                  onClick={() => startTraining(gesture)}
                  disabled={isTraining}
                  variant={currentTrainingGesture === gesture ? "default" : "outline"}
                >
                  Train {gesture} ({gestureToText[gesture]})
                </Button>
              ))}
            </div>
            
            {isTraining && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Hold the gesture for {gestureToText[currentTrainingGesture || '']} and move your hand slightly.
                  The system will collect data points.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Data points collected: {trainingData.length}
                </p>
                <Button
                  onClick={stopTraining}
                  className="mt-4"
                >
                  Stop Training
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Game Features Section */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Game Features</h2>
          
          {/* Score and Level Display */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold">Score: {score}</div>
              <div className="text-lg">Level: {level}</div>
              <div className="text-lg">Streak: {streak} 🔥</div>
            </div>
          </div>

          {/* Active Challenge */}
          {activeChallenge && (
            <div className="mb-6 p-4 bg-purple/10 rounded-lg">
              <h3 className="font-semibold mb-2">Active Challenge: {activeChallenge.title}</h3>
              <p className="text-sm text-gray-600 mb-2">{activeChallenge.description}</p>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Progress: {challengeProgress.length}/{activeChallenge.gestures.length}</span>
                <span className="ml-auto">Time: {challengeTimer}s</span>
              </div>
            </div>
          )}

          {/* Challenges */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Challenges</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.map(challenge => (
                <Card key={challenge.id} className={challenge.completed ? "opacity-50" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{challenge.title}</h4>
                      <Award className="w-4 h-4 text-yellow-500" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reward: {challenge.reward} points</span>
                      <Button
                        onClick={() => startChallenge(challenge)}
                        disabled={challenge.completed || !!activeChallenge}
                        size="sm"
                      >
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div>
            <h3 className="font-semibold mb-3">Achievements</h3>
            <div className="space-y-4">
              {achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    achievement.unlocked ? "bg-green-50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      achievement.unlocked ? "bg-green-100" : "bg-gray-100"
                    }`}>
                      {achievement.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple h-2 rounded-full"
                        style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm">
                      {achievement.progress}/{achievement.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add progress section */}
      {renderProgressSection()}
    </div>
  );
};

export default SignLanguageTranslator;

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Video, Captions, CaptionsOff, CloudDownload, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// Add type definitions for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  error: string;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface CaptionEntry {
  text: string;
  startTime: number;
  endTime: number;
  isEdited?: boolean;
}

const VideoCaptioner = () => {
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<CaptionEntry[]>([]);
  const [currentCaption, setCurrentCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>("");
  const startTimeRef = useRef<number>(0);
  const lastCaptionTimeRef = useRef<number>(0);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeCaptionIndex, setActiveCaptionIndex] = useState(-1);

  useEffect(() => {
    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        if (!videoRef.current) return;

        const currentTime = videoRef.current.currentTime;
        let interimTranscript = '';
        let finalTranscript = finalTranscriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            
            // Create a new caption entry with more precise timing
            const captionEntry: CaptionEntry = {
              text: transcript,
              startTime: currentTime - (transcript.length * 0.1), // Adjust timing based on text length
              endTime: currentTime
            };
            
            setGeneratedCaptions(prev => {
              const updated = [...prev];
              // Update the end time of the previous caption
              if (updated.length > 0) {
                updated[updated.length - 1].endTime = captionEntry.startTime;
              }
              updated.push(captionEntry);
              return updated;
            });
          } else {
            interimTranscript += transcript;
          }
        }

        finalTranscriptRef.current = finalTranscript;
        setCurrentCaption(finalTranscript + interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
      };

      recognitionRef.current.onend = () => {
        if (isProcessing) {
          // Restart recognition if it ended while we're still processing
          recognitionRef.current?.start();
        }
      };
    } else {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari for live captions.');
      console.warn('Web Speech API is not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isProcessing]);

  // Add video time update handler
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Find the active caption based on current video time
      const index = generatedCaptions.findIndex(
        caption => video.currentTime >= caption.startTime && video.currentTime <= caption.endTime
      );
      setActiveCaptionIndex(index);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [generatedCaptions]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSource(url);
      setGeneratedCaptions([]);
      setCurrentCaption("");
      finalTranscriptRef.current = "";
      startTimeRef.current = 0;
      lastCaptionTimeRef.current = 0;
      setError(null);
    }
  };

  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  const generateCaptions = async () => {
    if (!videoSource || !videoRef.current) return;
    
    setIsProcessing(true);
    setGeneratedCaptions([]);
    setCurrentCaption("");
    finalTranscriptRef.current = "";
    startTimeRef.current = 0;
    lastCaptionTimeRef.current = 0;
    setError(null);
    
    try {
      // Check if speech recognition is available
      if (!recognitionRef.current) {
        // Fallback to simulated captions if speech recognition is not available
        console.log('Speech recognition not available, using simulated captions');
        const simulatedCaptions = [
          "This is a simulated caption for demonstration purposes.",
          "In a real implementation, this would be replaced with actual speech-to-text results.",
          "The captions would be synchronized with the video playback."
        ];
        
        setGeneratedCaptions(simulatedCaptions.map((text, index) => ({
          text,
          startTime: index * 5,
          endTime: (index + 1) * 5
        })));
        
        setCurrentCaption(simulatedCaptions[0]);
        
        // Play the video
        videoRef.current.play();
        
        // Set up time-based caption updates
        const video = videoRef.current;
        let currentIndex = 0;
        
        const timeUpdateHandler = () => {
          const currentTime = video.currentTime;
          const duration = video.duration;
          
          if (currentTime > (duration * (currentIndex + 1)) / simulatedCaptions.length) {
            currentIndex = Math.min(currentIndex + 1, simulatedCaptions.length - 1);
            setCurrentCaption(simulatedCaptions[currentIndex]);
          }
        };
        
        video.addEventListener('timeupdate', timeUpdateHandler);
        
        // Stop when video ends
        video.onended = () => {
          video.removeEventListener('timeupdate', timeUpdateHandler);
          setIsProcessing(false);
        };
        
        return;
      }
      
      // Create a MediaStream from the video element
      const video = videoRef.current;
      const stream = video.captureStream();
      
      // Get the audio track from the stream
      const audioTrack = stream.getAudioTracks()[0];
      
      if (!audioTrack) {
        throw new Error("No audio track found in the video");
      }
      
      // Create a new MediaStream with just the audio track
      const audioStream = new MediaStream([audioTrack]);
      
      // Create an AudioContext to process the audio
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(audioStream);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      
      // Start speech recognition
      recognitionRef.current.start();
      
      // Play the video
      video.play();
      
      // Stop recognition when video ends
      video.onended = () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setIsProcessing(false);
      };
    } catch (error) {
      console.error('Error generating captions:', error);
      setError('Error generating captions. Please try again.');
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Auto-save function
  const autoSaveCaptions = () => {
    if (generatedCaptions.length === 0) return;

    const notesText = generatedCaptions
      .map(caption => `[${formatTime(caption.startTime)} - ${formatTime(caption.endTime)}] ${caption.text}`)
      .join("\n\n");

    localStorage.setItem('videoCaptions', notesText);
    setAutoSaveStatus("Auto-saved");
    
    // Clear status after 2 seconds
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      setAutoSaveStatus("");
    }, 2000);
  };

  // Load saved captions
  useEffect(() => {
    const savedCaptions = localStorage.getItem('videoCaptions');
    if (savedCaptions) {
      const captions = savedCaptions.split('\n\n').map(line => {
        const match = line.match(/\[(\d+:\d+) - (\d+:\d+)\] (.+)/);
        if (match) {
          const [_, startTime, endTime, text] = match;
          return {
            text,
            startTime: convertTimeToSeconds(startTime),
            endTime: convertTimeToSeconds(endTime),
            isEdited: true
          };
        }
        return null;
      }).filter(Boolean) as CaptionEntry[];
      
      if (captions.length > 0) {
        setGeneratedCaptions(captions);
      }
    }
  }, []);

  // Auto-save when captions change
  useEffect(() => {
    autoSaveCaptions();
  }, [generatedCaptions]);

  const convertTimeToSeconds = (timeString: string): number => {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  const handleCaptionEdit = (index: number, newText: string) => {
    setGeneratedCaptions(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        text: newText,
        isEdited: true
      };
      return updated;
    });
  };

  const handleSaveNotes = () => {
    if (generatedCaptions.length === 0) return;
    
    const notesText = generatedCaptions
      .map(caption => `[${formatTime(caption.startTime)} - ${formatTime(caption.endTime)}] ${caption.text}`)
      .join("\n\n");
    
    const blob = new Blob([notesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "lecture-notes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 gradient-heading text-center">Video Captioning</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="upload">Upload Video</TabsTrigger>
          <TabsTrigger value="url">Video URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <Card>
            <CardContent className="p-6">
              <Input 
                type="file" 
                accept="video/*" 
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              
              {!videoSource ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer"
                  onClick={handleSelectFileClick}
                >
                  <div className="flex flex-col items-center justify-center">
                    <Video className="h-10 w-10 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-1">Drag and drop a video file</p>
                    <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                    <Button variant="outline" onClick={handleSelectFileClick}>Select Video</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Video Player */}
                    <div className="space-y-4">
                      <video 
                        src={videoSource} 
                        controls 
                        className="w-full rounded-lg"
                        ref={videoRef}
                      />
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="captions-toggle" 
                            checked={captionsEnabled}
                            onCheckedChange={setCaptionsEnabled}
                          />
                          <Label htmlFor="captions-toggle">Show captions</Label>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={handleSelectFileClick}
                        >
                          Change Video
                        </Button>
                      </div>
                    </div>

                    {/* Live Captions */}
                    <div className="bg-gray-50 rounded-lg p-4 h-[300px] overflow-y-auto">
                      <h3 className="text-lg font-semibold mb-2">Live Captions</h3>
                      <div className="space-y-2">
                        {currentCaption && (
                          <div className="bg-white p-3 rounded shadow">
                            <p className="text-gray-800">{currentCaption}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {videoSource && (
            <div className="mt-6 flex justify-center">
              <Button 
                onClick={generateCaptions}
                disabled={isProcessing}
                className="bg-ocean-blue hover:bg-blue-600"
              >
                {isProcessing ? "Processing..." : "Generate Captions"}
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="url">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="video-url">Video URL</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="video-url" 
                    placeholder="https://example.com/video.mp4" 
                  />
                  <Button variant="outline">Load</Button>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Enter the URL of a publicly accessible video file
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Generated Transcript */}
      {generatedCaptions.length > 0 && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold">Video Transcript</h2>
                {autoSaveStatus && (
                  <span className="text-sm text-green-600 flex items-center">
                    <Save className="h-4 w-4 mr-1" />
                    {autoSaveStatus}
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSaveNotes}
                className="flex items-center"
              >
                <CloudDownload className="mr-2 h-4 w-4" />
                Export Notes
              </Button>
            </div>
            <div className="bg-gray-50 p-4 rounded-md space-y-4 max-h-96 overflow-y-auto">
              {generatedCaptions.map((caption, index) => (
                <div 
                  key={index} 
                  className={`flex items-start space-x-2 p-2 rounded ${
                    index === activeCaptionIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="text-sm text-gray-500 min-w-[120px]">
                    {formatTime(caption.startTime)} - {formatTime(caption.endTime)}
                  </span>
                  <div className="flex-1">
                    <Textarea
                      value={caption.text}
                      onChange={(e) => handleCaptionEdit(index, e.target.value)}
                      className={`min-h-[60px] bg-white ${
                        index === activeCaptionIndex ? 'border-blue-300' : ''
                      }`}
                      placeholder="Edit caption..."
                    />
                    {caption.isEdited && (
                      <span className="text-xs text-gray-500 mt-1">Edited</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="mt-8 bg-soft-blue rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Pro Tips</h3>
        <ul className="space-y-2 list-disc list-inside text-gray-700">
          <li>For best results, use videos with clear audio</li>
          <li>Supported formats: MP4, MOV, AVI, WebM</li>
          <li>Save generated captions as notes for later reference</li>
          <li>Use the timestamp feature to navigate to specific parts of the lecture</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoCaptioner;
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Video, Captions, CaptionsOff, CloudDownload } from "lucide-react";

// Add type declaration for captureStream
declare global {
  interface HTMLVideoElement {
    captureStream(): MediaStream;
  }
}

const VideoCaptioner = () => {
  const [videoSource, setVideoSource] = useState<string | null>(null);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
  const [currentCaption, setCurrentCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSource(url);
      setGeneratedCaptions([]);
      setCurrentCaption("");
      setError(null);
    }
  };

  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  const extractAudioFromVideo = async (videoBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoBlob);
      
      video.onloadedmetadata = () => {
        const audioContext = new AudioContext();
        const videoElement = video;
        
        const stream = videoElement.captureStream();
        const audioTrack = stream.getAudioTracks()[0];
        const mediaStream = new MediaStream([audioTrack]);
        
        const mediaRecorder = new MediaRecorder(mediaStream, {
          mimeType: 'audio/webm'
        });
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          resolve(audioBlob);
        };
        
        mediaRecorder.onerror = (error) => {
          reject(error);
        };
        
        mediaRecorder.start();
        videoElement.play();
        
        videoElement.onended = () => {
          mediaRecorder.stop();
        };
      };
      
      video.onerror = (error) => {
        reject(error);
      };
    });
  };

  const generateCaptions = async () => {
    if (!videoSource || !videoRef.current) return;
    
    setIsProcessing(true);
    setGeneratedCaptions([]);
    setCurrentCaption("");
    setError(null);
    audioChunksRef.current = [];
    
    try {
      const videoBlob = await fetch(videoSource).then(r => r.blob());
      const audioBlob = await extractAudioFromVideo(videoBlob);
      
      // For now, we'll simulate the transcription process
      // This will be replaced with actual Google Cloud Speech-to-Text integration
      const simulatedCaptions = [
        "This is a simulated caption for demonstration purposes.",
        "In a real implementation, this would be replaced with actual speech-to-text results.",
        "The captions would be synchronized with the video playback."
      ];
      
      setGeneratedCaptions(simulatedCaptions);
      setCurrentCaption(simulatedCaptions[0]);
      
      if (videoRef.current) {
        const video = videoRef.current;
        let currentIndex = 0;
        
        video.addEventListener('timeupdate', () => {
          const currentTime = video.currentTime;
          const duration = video.duration;
          
          if (currentTime > (duration * (currentIndex + 1)) / simulatedCaptions.length) {
            currentIndex = Math.min(currentIndex + 1, simulatedCaptions.length - 1);
            setCurrentCaption(simulatedCaptions[currentIndex]);
          }
        });
      }
    } catch (error) {
      console.error('Error generating captions:', error);
      setError('Failed to generate captions. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveNotes = () => {
    if (generatedCaptions.length === 0) return;
    
    const notesText = generatedCaptions.join("\n\n");
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
    <div className="max-w-4xl mx-auto px-4 py-8">
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
                  <div className="relative">
                    <video 
                      src={videoSource} 
                      controls 
                      className="w-full rounded-lg"
                      ref={videoRef}
                    />
                    {captionsEnabled && currentCaption && (
                      <div className="absolute bottom-16 left-0 right-0 bg-black/70 text-white p-3 text-center">
                        {currentCaption}
                      </div>
                    )}
                  </div>
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
      
      {/* Generated Captions/Notes */}
      {generatedCaptions.length > 0 && (
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Generated Transcript</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSaveNotes}
                className="flex items-center"
              >
                <CloudDownload className="mr-2 h-4 w-4" />
                Save as Notes
              </Button>
            </div>
            <div className="bg-gray-50 p-4 rounded-md space-y-4 max-h-96 overflow-y-auto">
              {generatedCaptions.map((caption, index) => (
                <p key={index} className="text-gray-800">{caption}</p>
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

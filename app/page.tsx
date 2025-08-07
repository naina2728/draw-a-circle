'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DrawingCanvas from '@/components/drawing-canvas'
import ScoreDisplay from '@/components/score-display'
import { Point, CircleAnalysis, analyzeCircle } from '@/lib/circle-math'
import { RotateCcw, Share2, Trophy, Info, Target } from 'lucide-react'
import { sdk } from '@farcaster/miniapp-sdk'

export default function PerfectCircleChallenge() {
  const [drawnPoints, setDrawnPoints] = useState<Point[]>([])
  const [analysis, setAnalysis] = useState<CircleAnalysis | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [showInstructions, setShowInstructions] = useState(true)
  const [isSDKReady, setIsSDKReady] = useState(false)
  const [isFarcasterContext, setIsFarcasterContext] = useState(false)

  // Initialize Farcaster MiniApp SDK
 
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (loaded) sdk.actions.ready();
  }, [loaded]);

  const handleTryAgain = () => {
    setDrawnPoints([])
    setAnalysis(null)
    setShowResults(false)
    setIsDrawing(false)
    setShowInstructions(false)
  }

  const handleShare = async () => {
    if (analysis) {
      const text = `I scored ${analysis.score}% on the Perfect Circle Challenge! 🎯 Can you beat my score?`
      const url = window.location.href
      
      try {
        // Try Farcaster sharing first if we're in a Farcaster context
        if (typeof sdk !== 'undefined' && sdk.actions && isFarcasterContext) {
          console.log('Attempting Farcaster share...')
          
          // Create a cast with the Mini App embed
          const castText = `${text}\n\nTry the challenge yourself! 👇`
          
          // Use the SDK to open the compose dialog with the embed
          // This will automatically include the Mini App embed when the URL is detected
          await sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(castText)}&embeds[]=${encodeURIComponent(url)}`)
          
          console.log('Farcaster share initiated successfully!')
          return
        }
      } catch (error) {
        console.log('Farcaster sharing not available, falling back to native sharing:', error)
      }
      
      // Fallback to native sharing
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Perfect Circle Challenge',
            text: text,
            url: url
          })
        } catch (err) {
          // User cancelled sharing or share failed
          console.log('Native sharing cancelled or failed:', err)
        }
      } else {
        // Final fallback: clipboard
        try {
          await navigator.clipboard.writeText(text + ' ' + url)
          alert('Score copied to clipboard! 📋\n\nPaste it anywhere to share your score!')
        } catch (clipboardErr) {
          console.error('Clipboard access failed:', clipboardErr)
          // Show the text in a prompt as final fallback
          prompt('Copy this text to share your score:', text + ' ' + url)
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-10">
        <div className="px-4 py-3">
          <h1 className="text-2xl font-bold text-gray-800 text-center">
            Perfect Circle Challenge
          </h1>
          <div className="flex justify-center items-center gap-4 mt-2">
            {attempts > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Trophy className="w-3 h-3 mr-1" />
                Attempts: {attempts}
              </Badge>
            )}
            {bestScore > 0 && (
              <Badge variant="outline" className="text-xs text-green-600">
                Best: {bestScore}%
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Instructions Card - Mobile First */}
        {showInstructions && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">How to Play</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• Touch and drag to draw a circle</p>
                    <p>• Try to make it as perfect as possible</p>
                    <p>• Release to see your precision score</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drawing Canvas - Optimized for Mobile */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-lg">
              {isDrawing ? (
                <span className="text-blue-600">Keep drawing... 🎨</span>
              ) : showResults ? (
                "Your Circle vs Perfect Circle"
              ) : (
                "Tap and drag to draw your circle"
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex justify-center mb-4">
              <DrawingCanvas
                onDrawingComplete={handleDrawingComplete}
                onDrawingStart={handleDrawingStart}
                isDrawing={isDrawing}
                showOverlay={showResults}
                overlayCircle={analysis?.bestFitCircle}
                drawnPoints={drawnPoints}
              />
            </div>

            {/* Legend for mobile */}
            {showResults && (
              <div className="flex justify-center gap-6 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1 bg-blue-500 rounded"></div>
                  <span>Your circle</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1 border border-red-500 border-dashed rounded"></div>
                  <span>Perfect circle</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons - Mobile Optimized */}
        <div className="flex gap-3">
          <Button 
            onClick={handleTryAgain}
            variant="outline"
            disabled={isDrawing}
            className="flex-1 h-12"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          {showResults && (
            <Button 
              onClick={handleShare}
              className="flex-1 h-12"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {isFarcasterContext ? 'Cast Score' : 'Share Score'}
            </Button>
          )}
        </div>

        {/* Score Display */}
        {showResults && (
          <ScoreDisplay 
            analysis={analysis} 
            isVisible={showResults} 
          />
        )}

        {/* Tips Card - Only show after first attempt */}
        {showResults && analysis && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-5 h-5" />
                Tips to Improve
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 text-sm text-gray-600">
                <p>• <strong>Go slow:</strong> Steady movements work better than fast ones</p>
                <p>• <strong>Use your whole arm:</strong> Don't just move your wrist</p>
                <p>• <strong>Find your rhythm:</strong> Try to maintain consistent speed</p>
                <p>• <strong>Practice:</strong> Most people improve significantly with attempts!</p>
              </div>
              
              {analysis.score < 70 && (
                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Pro tip:</strong> Try drawing a smaller circle first - they're often easier to control!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Achievement Badges */}
        {bestScore > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your Achievement</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-3xl mb-2">
                  {bestScore >= 95 && "🎯"}
                  {bestScore >= 90 && bestScore < 95 && "🏆"}
                  {bestScore >= 80 && bestScore < 90 && "⭐"}
                  {bestScore >= 70 && bestScore < 80 && "🎪"}
                  {bestScore >= 60 && bestScore < 70 && "🥚"}
                  {bestScore < 60 && "🎨"}
                </div>
                <div className="font-semibold text-gray-800">
                  Personal Best: {bestScore}%
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {bestScore >= 95 && "Circle Master! Incredible precision!"}
                  {bestScore >= 90 && bestScore < 95 && "Excellent! You have very steady hands!"}
                  {bestScore >= 80 && bestScore < 90 && "Great job! That's impressive!"}
                  {bestScore >= 70 && bestScore < 80 && "Good work! Keep practicing!"}
                  {bestScore >= 60 && bestScore < 70 && "Not bad! You're getting there!"}
                  {bestScore < 60 && "Keep trying! Everyone improves with practice!"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

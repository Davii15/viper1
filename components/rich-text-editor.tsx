"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  ImageIcon,
  Palette,
  Highlighter,
  ChevronDown,
  Undo,
  Redo,
  Subscript,
  Superscript,
  Type,
  Link,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

const FONT_FAMILIES = [
  { name: "Default", value: "inherit" },
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Helvetica", value: "Helvetica, sans-serif" },
  { name: "Times New Roman", value: "Times New Roman, serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Verdana", value: "Verdana, sans-serif" },
  { name: "Courier New", value: "Courier New, monospace" },
  { name: "Impact", value: "Impact, sans-serif" },
  { name: "Comic Sans MS", value: "Comic Sans MS, cursive" },
  { name: "Trebuchet MS", value: "Trebuchet MS, sans-serif" },
]

const FONT_SIZES = [
  { name: "Small", value: "12px" },
  { name: "Normal", value: "14px" },
  { name: "Medium", value: "16px" },
  { name: "Large", value: "18px" },
  { name: "Extra Large", value: "24px" },
  { name: "Huge", value: "32px" },
]

const TEXT_COLORS = [
  "#000000",
  "#333333",
  "#666666",
  "#999999",
  "#CCCCCC",
  "#FFFFFF",
  "#FF0000",
  "#FF6600",
  "#FFCC00",
  "#00FF00",
  "#0066FF",
  "#6600FF",
  "#FF0066",
  "#FF3366",
  "#FF6699",
  "#66FF99",
  "#6699FF",
  "#9966FF",
]

const BACKGROUND_COLORS = [
  "transparent",
  "#FFFF00",
  "#00FFFF",
  "#FF00FF",
  "#C0C0C0",
  "#808080",
  "#800000",
  "#FF0000",
  "#808000",
  "#FFFF00",
  "#008000",
  "#00FF00",
  "#008080",
  "#00FFFF",
  "#000080",
  "#0000FF",
  "#800080",
  "#FF00FF",
]

const GRADIENT_BACKGROUNDS = [
  "linear-gradient(45deg, #ff6b6b, #feca57)",
  "linear-gradient(45deg, #48cae4, #023e8a)",
  "linear-gradient(45deg, #f72585, #b5179e)",
  "linear-gradient(45deg, #f77f00, #fcbf49)",
  "linear-gradient(45deg, #06ffa5, #0077b6)",
  "linear-gradient(45deg, #7209b7, #560bad)",
  "linear-gradient(45deg, #ff006e, #fb8500)",
  "linear-gradient(45deg, #8ecae6, #219ebc)",
]

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  minHeight = "400px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [selectedFont, setSelectedFont] = useState("inherit")
  const [selectedSize, setSelectedSize] = useState("16px")
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // ✅ Fix cursor jumping issue - only update when value changes externally
  useEffect(() => {
    if (editorRef.current && !isUpdating && editorRef.current.innerHTML !== value) {
      const selection = window.getSelection()
      const range = selection?.getRangeAt(0)
      const cursorPosition = range?.startOffset

      editorRef.current.innerHTML = value

      // Restore cursor position if possible
      if (selection && range && cursorPosition !== undefined) {
        try {
          const newRange = document.createRange()
          const textNode = editorRef.current.firstChild
          if (textNode) {
            newRange.setStart(textNode, Math.min(cursorPosition, textNode.textContent?.length || 0))
            newRange.collapse(true)
            selection.removeAllRanges()
            selection.addRange(newRange)
          }
        } catch (error) {
          // Ignore cursor restoration errors
        }
      }
    }
  }, [value, isUpdating])

  const executeCommand = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value)
      if (editorRef.current) {
        setIsUpdating(true)
        onChange(editorRef.current.innerHTML)
        setTimeout(() => setIsUpdating(false), 0)
      }
    },
    [onChange],
  )

  const handleInput = useCallback(() => {
    if (editorRef.current && !isUpdating) {
      setIsUpdating(true)
      onChange(editorRef.current.innerHTML)
      setTimeout(() => setIsUpdating(false), 0)
    }
  }, [onChange, isUpdating])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Handle keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "b":
            e.preventDefault()
            executeCommand("bold")
            break
          case "i":
            e.preventDefault()
            executeCommand("italic")
            break
          case "u":
            e.preventDefault()
            executeCommand("underline")
            break
          case "z":
            e.preventDefault()
            if (e.shiftKey) {
              executeCommand("redo")
            } else {
              executeCommand("undo")
            }
            break
        }
      }
    },
    [executeCommand],
  )

  const insertDropCap = () => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()

      if (selectedText.length > 0) {
        const dropCapSpan = document.createElement("span")
        dropCapSpan.style.cssText = `
          float: left;
          font-size: 3.5em;
          line-height: 0.8;
          padding-right: 8px;
          padding-top: 4px;
          font-weight: bold;
          color: #e74c3c;
        `
        dropCapSpan.textContent = selectedText.charAt(0)

        const remainingText = document.createTextNode(selectedText.slice(1))

        range.deleteContents()
        range.insertNode(remainingText)
        range.insertNode(dropCapSpan)

        handleInput()
      }
    }
  }

  const insertLink = () => {
    if (linkUrl) {
      executeCommand("createLink", linkUrl)
      setLinkUrl("")
      setShowLinkDialog(false)
    }
  }

  const insertImage = () => {
    if (imageUrl) {
      executeCommand("insertImage", imageUrl)
      setImageUrl("")
      setShowImageDialog(false)
    }
  }

  const applyFontFamily = (fontFamily: string) => {
    executeCommand("fontName", fontFamily)
    setSelectedFont(fontFamily)
  }

  const applyFontSize = (fontSize: string) => {
    // Convert px to HTML font size (1-7)
    const sizeMap: { [key: string]: string } = {
      "12px": "1",
      "14px": "2",
      "16px": "3",
      "18px": "4",
      "24px": "5",
      "32px": "6",
      "48px": "7",
    }
    executeCommand("fontSize", sizeMap[fontSize] || "3")
    setSelectedSize(fontSize)
  }

  const applyTextColor = (color: string) => {
    executeCommand("foreColor", color)
  }

  const applyBackgroundColor = (color: string) => {
    if (color === "transparent") {
      executeCommand("hiliteColor", "transparent")
    } else {
      executeCommand("hiliteColor", color)
    }
  }

  const applyGradientBackground = (gradient: string) => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()

      if (selectedText.length > 0) {
        const span = document.createElement("span")
        span.style.background = gradient
        span.style.webkitBackgroundClip = "text"
        span.style.webkitTextFillColor = "transparent"
        span.style.backgroundClip = "text"
        span.style.display = "inline-block"
        span.textContent = selectedText

        range.deleteContents()
        range.insertNode(span)

        handleInput()
      }
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      {/* ✅ Enhanced Toolbar with better visibility */}
      <div className="border-b p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
        <div className="flex flex-wrap items-center gap-1">
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("undo")}
            title="Undo (Ctrl+Z)"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("redo")}
            title="Redo (Ctrl+Shift+Z)"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <Redo className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Font Family */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[120px] justify-between bg-white hover:bg-gray-50">
                <span className="truncate">{FONT_FAMILIES.find((f) => f.value === selectedFont)?.name || "Font"}</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              {FONT_FAMILIES.map((font) => (
                <DropdownMenuItem
                  key={font.value}
                  onClick={() => applyFontFamily(font.value)}
                  style={{ fontFamily: font.value }}
                  className="hover:bg-blue-50"
                >
                  {font.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Font Size */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="min-w-[80px] justify-between bg-white hover:bg-gray-50">
                <span>{FONT_SIZES.find((s) => s.value === selectedSize)?.name || "Size"}</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {FONT_SIZES.map((size) => (
                <DropdownMenuItem
                  key={size.value}
                  onClick={() => applyFontSize(size.value)}
                  className="hover:bg-blue-50"
                >
                  {size.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text Formatting */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("bold")}
            title="Bold (Ctrl+B)"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("italic")}
            title="Italic (Ctrl+I)"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("underline")}
            title="Underline (Ctrl+U)"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <Underline className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("strikeThrough")}
            title="Strikethrough"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("subscript")}
            title="Subscript"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <Subscript className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("superscript")}
            title="Superscript"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <Superscript className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Text Color" className="hover:bg-blue-100 hover:text-blue-700">
                <Type className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <Label className="font-semibold">Text Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border-2 border-gray-200 hover:border-blue-400 hover:scale-110 transition-all"
                      style={{ backgroundColor: color }}
                      onClick={() => applyTextColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Background Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                title="Background Color"
                className="hover:bg-blue-100 hover:text-blue-700"
              >
                <Highlighter className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <Label className="font-semibold">Background Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {BACKGROUND_COLORS.map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border-2 border-gray-200 hover:border-blue-400 hover:scale-110 transition-all"
                      style={{
                        backgroundColor: color === "transparent" ? "#fff" : color,
                        backgroundImage:
                          color === "transparent"
                            ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                            : "none",
                        backgroundSize: color === "transparent" ? "8px 8px" : "auto",
                        backgroundPosition: color === "transparent" ? "0 0, 0 4px, 4px -4px, -4px 0px" : "auto",
                      }}
                      onClick={() => applyBackgroundColor(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Gradient Background */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                title="Gradient Background"
                className="hover:bg-blue-100 hover:text-blue-700"
              >
                <Palette className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <Label className="font-semibold">Gradient Background</Label>
                <div className="grid grid-cols-2 gap-2">
                  {GRADIENT_BACKGROUNDS.map((gradient, index) => (
                    <button
                      key={index}
                      className="w-full h-8 rounded border-2 border-gray-200 hover:border-blue-400 hover:scale-105 transition-all"
                      style={{ background: gradient }}
                      onClick={() => applyGradientBackground(gradient)}
                      title={`Gradient ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Alignment */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("justifyLeft")}
            title="Align Left"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("justifyCenter")}
            title="Align Center"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("justifyRight")}
            title="Align Right"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("justifyFull")}
            title="Justify"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <AlignJustify className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("insertUnorderedList")}
            title="Bullet List"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("insertOrderedList")}
            title="Numbered List"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Special Formatting */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("formatBlock", "blockquote")}
            title="Quote"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <Quote className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => executeCommand("formatBlock", "pre")}
            title="Code Block"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <Code className="w-4 h-4" />
          </Button>

          {/* Drop Cap */}
          <Button
            variant="ghost"
            size="sm"
            onClick={insertDropCap}
            title="Drop Cap (Select first letter)"
            className="hover:bg-blue-100 hover:text-blue-700"
          >
            <span className="text-lg font-bold">A</span>
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Link */}
          <Popover open={showLinkDialog} onOpenChange={setShowLinkDialog}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Insert Link" className="hover:bg-blue-100 hover:text-blue-700">
                <Link className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <Label className="font-semibold">Insert Link</Label>
                <Input
                  placeholder="Enter URL..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && insertLink()}
                  className="focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setShowLinkDialog(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={insertLink} className="bg-blue-600 hover:bg-blue-700">
                    Insert
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Image */}
          <Popover open={showImageDialog} onOpenChange={setShowImageDialog}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Insert Image" className="hover:bg-blue-100 hover:text-blue-700">
                <ImageIcon className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <Label className="font-semibold">Insert Image</Label>
                <Input
                  placeholder="Enter image URL..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && insertImage()}
                  className="focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setShowImageDialog(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={insertImage} className="bg-blue-600 hover:bg-blue-700">
                    Insert
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ✅ Enhanced Editor with better background and visibility */}
      <div
        ref={editorRef}
        contentEditable
        className="p-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset bg-white text-gray-900 leading-relaxed"
        style={{
          minHeight,
          fontFamily: selectedFont,
          fontSize: selectedSize,
          backgroundColor: "#ffffff", // ✅ Ensure white background
          color: "#1f2937", // ✅ Ensure dark text
        }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      {/* ✅ Enhanced Styles */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          font-style: italic;
        }
        
        [contenteditable]:focus:empty:before {
          color: #6b7280;
        }
        
        [contenteditable] blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #4b5563;
          background-color: #f8fafc;
          padding: 1rem;
          border-radius: 0.375rem;
        }
        
        [contenteditable] pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          font-family: 'Courier New', monospace;
          overflow-x: auto;
          margin: 1rem 0;
          border: 1px solid #374151;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 2rem;
          margin: 1rem 0;
        }
        
        [contenteditable] li {
          margin: 0.5rem 0;
          line-height: 1.6;
        }
        
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
          text-decoration-color: #93c5fd;
          transition: all 0.2s;
        }
        
        [contenteditable] a:hover {
          color: #1d4ed8;
          text-decoration-color: #3b82f6;
        }
        
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        [contenteditable] h1, [contenteditable] h2, [contenteditable] h3 {
          font-weight: bold;
          margin: 1.5rem 0 1rem 0;
          line-height: 1.3;
        }
        
        [contenteditable] h1 {
          font-size: 2rem;
          color: #1f2937;
        }
        
        [contenteditable] h2 {
          font-size: 1.5rem;
          color: #374151;
        }
        
        [contenteditable] h3 {
          font-size: 1.25rem;
          color: #4b5563;
        }
        
        [contenteditable] p {
          margin: 0.75rem 0;
          line-height: 1.7;
        }
        
        [contenteditable]:focus {
          background-color: #ffffff !important;
        }
        
        /* ✅ Ensure text is always visible */
        [contenteditable] * {
          color: inherit;
        }
        
        /* ✅ Better selection styling */
        [contenteditable]::selection {
          background-color: #dbeafe;
          color: #1e40af;
        }
      `}</style>
    </div>
  )
}

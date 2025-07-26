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
  const [selectedSize, setSelectedSize] = useState("14px")
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [imageUrl, setImageUrl] = useState("")

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const executeCommand = useCallback(
    (command: string, value?: string) => {
      document.execCommand(command, false, value)
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML)
      }
    },
    [onChange],
  )

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

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
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="border-b p-2 bg-gray-50">
        <div className="flex flex-wrap items-center gap-1">
          {/* Undo/Redo */}
          <Button variant="ghost" size="sm" onClick={() => executeCommand("undo")} title="Undo (Ctrl+Z)">
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => executeCommand("redo")} title="Redo (Ctrl+Shift+Z)">
            <Redo className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Font Family */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="min-w-[120px] justify-between">
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
                >
                  {font.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Font Size */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="min-w-[80px] justify-between">
                <span>{FONT_SIZES.find((s) => s.value === selectedSize)?.name || "Size"}</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {FONT_SIZES.map((size) => (
                <DropdownMenuItem key={size.value} onClick={() => applyFontSize(size.value)}>
                  {size.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text Formatting */}
          <Button variant="ghost" size="sm" onClick={() => executeCommand("bold")} title="Bold (Ctrl+B)">
            <Bold className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => executeCommand("italic")} title="Italic (Ctrl+I)">
            <Italic className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => executeCommand("underline")} title="Underline (Ctrl+U)">
            <Underline className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => executeCommand("strikeThrough")} title="Strikethrough">
            <Strikethrough className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => executeCommand("subscript")} title="Subscript">
            <Subscript className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => executeCommand("superscript")} title="Superscript">
            <Superscript className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Text Color">
                <Type className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <Label>Text Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400"
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
              <Button variant="ghost" size="sm" title="Background Color">
                <Highlighter className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <Label>Background Color</Label>
                <div className="grid grid-cols-6 gap-2">
                  {BACKGROUND_COLORS.map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400"
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
              <Button variant="ghost" size="sm" title="Gradient Background">
                <Palette className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <Label>Gradient Background</Label>
                <div className="grid grid-cols-2 gap-2">
                  {GRADIENT_BACKGROUNDS.map((gradient, index) => (
                    <button
                      key={index}
                      className="w-full h-8 rounded border-2 border-gray-200 hover:border-gray-400"
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
          <Button variant="ghost" size="sm" onClick={() => executeCommand("justifyLeft")} title="Align Left">
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => executeCommand("justifyCenter")} title="Align Center">
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => executeCommand("justifyRight")} title="Align Right">
            <AlignRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => executeCommand("justifyFull")} title="Justify">
            <AlignJustify className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists */}
          <Button variant="ghost" size="sm" onClick={() => executeCommand("insertUnorderedList")} title="Bullet List">
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => executeCommand("insertOrderedList")} title="Numbered List">
            <ListOrdered className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Special Formatting */}
          <Button variant="ghost" size="sm" onClick={() => executeCommand("formatBlock", "blockquote")} title="Quote">
            <Quote className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => executeCommand("formatBlock", "pre")} title="Code Block">
            <Code className="w-4 h-4" />
          </Button>

          {/* Drop Cap */}
          <Button variant="ghost" size="sm" onClick={insertDropCap} title="Drop Cap (Select first letter)">
            <span className="text-lg font-bold">A</span>
          </Button>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Link */}
          <Popover open={showLinkDialog} onOpenChange={setShowLinkDialog}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Insert Link">
                <Link className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <Label>Insert Link</Label>
                <Input
                  placeholder="Enter URL..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && insertLink()}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setShowLinkDialog(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={insertLink}>
                    Insert
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Image */}
          <Popover open={showImageDialog} onOpenChange={setShowImageDialog}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Insert Image">
                <ImageIcon className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <Label>Insert Image</Label>
                <Input
                  placeholder="Enter image URL..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && insertImage()}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setShowImageDialog(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={insertImage}>
                    Insert
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="p-4 focus:outline-none"
        style={{
          minHeight,
          fontFamily: selectedFont,
          fontSize: selectedSize,
        }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
        
        [contenteditable] pre {
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.375rem;
          font-family: 'Courier New', monospace;
          overflow-x: auto;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 2rem;
          margin: 0.5rem 0;
        }
        
        [contenteditable] li {
          margin: 0.25rem 0;
        }
        
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  )
}

# 6. UI/UX DESIGN SYSTEM & SEO

## 6.1. Design Philosophy
**"Industrial Clean"**: The interface must be high-contrast, minimalist, and data-centric. It prioritizes clarity and readability in warehouse environments where lighting conditions vary.

## 6.2. Color Palette
The system uses a strict color code to ensure semantic meaning (Green = Good, Red = Bad).

### A. Primary Brand Colors
* **Primary Blue:** `#2563EB` (Royal Blue) - Used for: Main Buttons, Active Tabs, Header Highlights.
* **Secondary Blue:** `#1E40AF` (Dark Blue) - Used for: Hover states, Dark mode accents.

### B. Semantic Status Colors (Critical)
* **🟢 Success / Healthy:** `#10B981` (Emerald 500)
    * *Usage:* System Online, Connected, Battery > 50%, Task Completed.
* **🔴 Error / Alarm:** `#EF4444` (Red 500)
    * *Usage:* Critical Faults, Disconnected, Battery < 10%, Blocked Bin.
* **🟡 Warning / Pending:** `#F59E0B` (Amber 500)
    * *Usage:* Battery Low (< 20%), Queued Tasks, Maintenance Mode.
* **⚪ Neutral / Empty:** `#E5E7EB` (Gray 200)
    * *Usage:* Empty Bins, Offline (Non-critical), Borders.

### C. Backgrounds
* **Main Background:** `#F3F4F6` (Light Mode) / `#111827` (Dark Mode).
* **Surface/Card:** `#FFFFFF` (Light Mode) / `#1F2937` (Dark Mode).

## 6.3. Typography
* **Primary Font:** `Inter` (Google Fonts).
    * *Usage:* Headings, Labels, General Text.
* **Monospace Font:** `JetBrains Mono` or `Roboto Mono`.
    * *Usage:* **Coordinates (X, Y, Z)**, SKU Codes, Timestamps, Sensor Values.
    * *Reason:* Monospace ensures tabular data aligns perfectly for easier scanning.

## 6.4. Layout & Accessibility
* **Glassmorphism:** Use `backdrop-filter: blur(8px)` with `bg-white/80` for overlay panels (Task List, Controls) to maintain context of the 3D scene behind.
* **F-Pattern:** Place the most critical status indicators (Health, Alarms) in the top-right or top-left corners.
* **Touch Targets:** All interactive elements must be at least **44px** high for Tablet/Touchscreen usage.

## 6.5. SEO & Performance Standards
Even for an internal dashboard, following SEO standards ensures optimal browser performance and accessibility.

* **Meta Tags:**
    * Title: `Trackify - ASRS Monitoring`
    * Viewport: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no` (Prevents accidental zooming during 3D manipulation).
* **Asset Optimization:**
    * **3D Models (.glb):** Must be compressed using **Draco** or **glTF-Pipeline**. Max file size per model < 500KB.
    * **Images:** Use `.webp` format.
* **Performance Goals:**
    * **Lighthouse Score:** > 90 (Performance & Accessibility).
    * **First Contentful Paint (FCP):** < 1.0s.
    * **FPS (Frames Per Second):** Stable 60 FPS in 3D View.
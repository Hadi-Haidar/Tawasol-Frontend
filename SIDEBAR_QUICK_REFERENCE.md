# Sidebar Navigation - Quick Reference

## 🎯 At a Glance

| Feature | Desktop (≥1024px) | Mobile (<1024px) |
|---------|-------------------|------------------|
| **Type** | Fixed vertical sidebar | Off-canvas drawer |
| **Width** | 240px (expanded) / 72px (collapsed) | 280px |
| **Position** | Left, always visible | Hidden, slides in |
| **Toggle** | Chevron button | Hamburger menu |
| **Close** | Chevron button | Backdrop, swipe, ESC, nav click |
| **Content Behavior** | Shifts with sidebar | Overlay (no shift) |
| **Gestures** | None | Swipe right (open) / left (close) |

---

## 📐 Dimensions

```
Desktop Expanded:  240px
Desktop Collapsed: 72px
Mobile Drawer:     280px

Transition Speed:  300ms ease-in-out
Touch Target Min:  44px × 44px
```

---

## 🎨 Key Classes

### Desktop Sidebar
```jsx
className="w-[240px]"  // Expanded
className="w-[72px]"   // Collapsed
className="transition-all duration-300 ease-in-out"
```

### Mobile Drawer
```jsx
className="w-[280px]"
style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
className="transition-transform duration-300 ease-in-out"
```

### Backdrop
```jsx
className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
```

---

## 🔧 Usage Examples

### Basic Implementation

```jsx
import DashboardLayout from './components/layout/DashboardLayout';

function App() {
  return (
    <Route path="/user" element={<DashboardLayout />}>
      <Route path="dashboard" element={<Dashboard />} />
      {/* ...other routes */}
    </Route>
  );
}
```

### Custom Sidebar Content

```jsx
// Sidebar.js - Add new navigation item
const navigation = [
  { name: 'Dashboard', href: '/user/dashboard', icon: LayoutDashboard },
  { name: 'Settings', href: '/user/settings', icon: Settings }, // New item
];
```

### Toggle From Outside Component

```jsx
// In DashboardLayout or parent component
const handleToggle = () => {
  if (isMobile) {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  } else {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  }
};
```

---

## 🎯 Interaction Patterns

### Desktop
1. **Collapse**: Click chevron (←)
2. **Expand**: Click chevron (→)
3. **Navigate**: Click menu item
4. **Tooltip**: Hover over icon (when collapsed)

### Mobile
1. **Open**: 
   - Tap hamburger menu
   - Swipe right from left edge
2. **Close**:
   - Tap backdrop
   - Swipe left on drawer
   - Press ESC key
   - Tap navigation item
   - Tap menu button again

---

## 🧩 Component Props

### Sidebar Component

```typescript
// Desktop mode
<Sidebar
  isCollapsed={boolean}
  onToggleCollapse={() => void}
  isMobile={false}
/>

// Mobile mode
<Sidebar
  isOpen={boolean}
  onClose={() => void}
  isMobile={true}
/>
```

### TopNavbar Component

```typescript
<TopNavbar
  onMobileMenuToggle={() => void}
  isMobileMenuOpen={boolean}
  isMobile={boolean}
/>
```

---

## 🎨 Styling Customization

### Change Desktop Width
```jsx
// In Sidebar.js (Desktop mode)
className={isCollapsed ? 'w-[60px]' : 'w-[220px]'}  // Custom sizes
```

### Change Mobile Width
```jsx
// In Sidebar.js (Mobile mode)
className="w-[260px]"  // Custom size
```

### Change Animation Speed
```jsx
className="transition-all duration-500"  // Slower (500ms)
className="transition-all duration-200"  // Faster (200ms)
```

### Change Backdrop Opacity
```jsx
className="bg-black/30"  // Lighter (30%)
className="bg-black/70"  // Darker (70%)
```

---

## 🔍 State Management

### DashboardLayout State

```javascript
const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
```

### State Flow

```
User Action → State Update → Component Re-render → Visual Change

Desktop Example:
Click Chevron → setIsSidebarCollapsed(true) → Sidebar width: 240px → 72px

Mobile Example:
Tap Hamburger → setIsMobileMenuOpen(true) → Drawer transform: -100% → 0%
```

---

## ♿ Accessibility Quick Check

### Required ARIA Attributes
```jsx
<aside aria-label="Main navigation" aria-hidden={!isOpen}>
<button aria-label="Toggle sidebar" aria-expanded={!isCollapsed}>
<Link aria-current={isActive ? 'page' : undefined}>
```

### Keyboard Support
- `Tab`: Navigate through items
- `Enter/Space`: Activate link
- `Escape`: Close mobile drawer

### Focus Management
- Focus trap in mobile drawer
- Visible focus indicators
- Logical tab order

---

## 🐛 Common Issues & Fixes

### Issue: Sidebar overlaps content on desktop
**Fix**: Ensure main content has proper margin-left
```jsx
className={`flex-1 ${!isMobile ? (isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]') : ''}`}
```

### Issue: Mobile drawer doesn't close
**Fix**: Verify `onClose` is called and `isMobile={true}`
```jsx
<Sidebar isOpen={true} onClose={handleClose} isMobile={true} />
```

### Issue: Swipe not working
**Fix**: Check touch handlers are on parent container
```jsx
<div onTouchStart={...} onTouchMove={...} onTouchEnd={...}>
```

### Issue: Animation stutters
**Fix**: Use transform instead of width for mobile
```jsx
style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
```

---

## 📊 Performance Tips

### Do's ✅
- Use `transform` for animations (GPU accelerated)
- Memoize callbacks with `useCallback`
- Clean up event listeners
- Lock body scroll when drawer open
- Use `will-change` for animated properties

### Don'ts ❌
- Animate width on mobile (use transform)
- Forget to remove event listeners
- Put heavy logic in render
- Animate without `ease-in-out`
- Override `transition` property unnecessarily

---

## 📱 Device Testing Checklist

- [ ] iPhone SE (375px)
- [ ] iPhone 14 (390px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] Samsung S21 Ultra (412px)
- [ ] iPad Portrait (768px)
- [ ] iPad Landscape (1024px)
- [ ] MacBook (1280px)
- [ ] Desktop (1920px)

---

## 🎓 Best Practices

1. **Always separate mobile and desktop logic**
   ```jsx
   {isMobile ? <MobileVersion /> : <DesktopVersion />}
   ```

2. **Use semantic HTML**
   ```jsx
   <aside>, <nav>, <button>, <Link>
   ```

3. **Provide multiple close methods (mobile)**
   - Backdrop click
   - ESC key
   - Swipe gesture
   - Navigation click

4. **Test with keyboard only**
   - All actions should be keyboard accessible

5. **Verify touch targets**
   - Minimum 44px × 44px

6. **Use proper z-index layering**
   - Backdrop: 40
   - Sidebar: 40 (desktop), 50 (mobile drawer)
   - TopNavbar: 30

---

## 🔗 Related Files

```
src/
├── components/
│   └── layout/
│       ├── Sidebar.js          ← Main component
│       ├── DashboardLayout.js  ← Container
│       └── TopNavbar.js        ← Top bar with toggle
└── index.css                   ← Animations & utilities
```

---

## 📞 Quick Debugging

### Log current state
```javascript
console.log({
  isMobile,
  isSidebarCollapsed,
  isMobileMenuOpen,
  windowWidth: window.innerWidth
});
```

### Test responsive behavior
```javascript
// In browser console
window.dispatchEvent(new Event('resize'));
```

### Verify touch zones
```javascript
onTouchStart={(e) => {
  console.log('Touch X:', e.targetTouches[0].clientX);
  // Should be < 50 for edge swipe
}}
```

---

**Need more details? Check `SIDEBAR_REDESIGN_DOCUMENTATION.md`**


# Sticky Header Implementation Documentation

## Overview

This document explains the **sticky header behavior** implementation in the `HeaderBottom.tsx` component using React hooks (`useState` and `useEffect`). This is a fundamental UI pattern that makes the header "stick" to the top when users scroll past a certain point.

---

## File Reference

- **Component Location**: `apps/user-ui/src/shared/widgets/HeaderBottom.tsx`
- **Component Name**: `HeaderBottom`
- **Framework**: React with Next.js
- **Styling**: Tailwind CSS

---

## Visual Behavior

### Before Scroll (isSticky = false)

```
┌─────────────────────────────────────────┐
│  Eshop  │ Search... │ Hello, Sign In  │
├─────────────────────────────────────────┤
│ [All Departments] │ Home │ Products... │
├─────────────────────────────────────────┤
│                                         │
│  Page Content Here...                   │
│                                         │
```

- Header is in **relative** position (part of normal document flow)
- Takes up space in the layout
- Scrolls away with other content

### After Scroll > 100px (isSticky = true)

```
┌─────────────────────────────────────────┐
│ [All Departments] │ Home │ ... │ User   │
├─────────────────────────────────────────┤ ← FIXED AT TOP
│ Page Content Here...                    │
│                                         │
│  (scrolling content)                    │
│                                         │
```

- Header is in **fixed** position (sticks to viewport)
- Stays at top while user scrolls
- Does NOT take up space in the document flow
- Additional UI elements (user icons) become visible

---

## Core React Hooks Explained

### 1. useState - Managing State

#### What is State?

**State** is React's way of remembering information about your component. Think of it as the component's "memory."

#### Syntax

```tsx
const [variableName, setVariableName] = useState(initialValue);
```

| Part              | Meaning                        |
| ----------------- | ------------------------------ |
| `variableName`    | The value you want to track    |
| `setVariableName` | Function to update that value  |
| `useState()`      | React hook to initialize state |
| `initialValue`    | Starting value of the state    |

#### In Our Code

```tsx
const [show, setShow] = useState(false);
const [isSticky, setIsSticky] = useState(false);
```

| State Variable | Purpose                               | Initial Value        | Type    |
| -------------- | ------------------------------------- | -------------------- | ------- |
| `show`         | Track if dropdown menu is open/closed | `false` (closed)     | Boolean |
| `isSticky`     | Track if header should be sticky      | `false` (not sticky) | Boolean |

#### How State Updates Work

1. **Initial Render**: Component displays with `isSticky = false`
2. **User Scrolls**: Scroll event fires
3. **Update State**: `setIsSticky(true)` is called
4. **Re-render**: React updates component with new state
5. **DOM Changes**: Tailwind classes update based on new state

**Key Point**: When you call `setState`, React triggers a **re-render** of the component with the new values.

---

### 2. useEffect - Side Effects

#### What are Side Effects?

**Side effects** are actions that happen outside the normal rendering cycle. Examples:

- Listening to events (scroll, click, keyboard)
- Fetching data from APIs
- Timers (`setTimeout`, `setInterval`)
- Updating the document title
- Managing local storage

#### Why Do We Need useEffect?

Without `useEffect`, code in your component runs during rendering, which can cause bugs. `useEffect` lets you run code **after** rendering.

#### Syntax

```tsx
useEffect(() => {
  // Code to run
  return () => {
    // Cleanup code (optional)
  };
}, [dependencies]);
```

---

## Complete Implementation Breakdown

### Full Code

```tsx
useEffect(() => {
  const handleScroll = () => {
    if (window.scrollY > 100) {
      setIsSticky(true);
    } else {
      setIsSticky(false);
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, []);
```

### Line-by-Line Explanation

#### Line 1: Hook Declaration

```tsx
useEffect(() => {
```

- Calls the React `useEffect` hook
- The `(() => {` starts an anonymous arrow function (callback)
- This callback contains the code that will be executed

#### Lines 2-7: Define Event Handler

```tsx
const handleScroll = () => {
  if (window.scrollY > 100) {
    setIsSticky(true);
  } else {
    setIsSticky(false);
  }
};
```

**What's happening:**

- Creates a function `handleScroll` that will run **every time user scrolls**
- `window.scrollY` = JavaScript property that returns pixels scrolled down
- **Condition**: `window.scrollY > 100` checks if scrolled past 100px
- **If true**: Make header sticky by setting `isSticky = true`
- **If false**: Keep header normal by setting `isSticky = false`

**Key Concept - window.scrollY vs window.screenY (THE BUG)**

| Property         | What it returns                      | When to use                 |
| ---------------- | ------------------------------------ | --------------------------- |
| `window.scrollY` | Pixels scrolled down the **page**    | ✅ For scroll detection     |
| `window.screenY` | Y position of browser **on monitor** | ❌ Not for scroll detection |

_The original bug used `window.screenY`, which never changed!_

#### Line 9: Add Event Listener

```tsx
window.addEventListener('scroll', handleScroll);
```

**Breaking it down:**

- `window` = The browser's global object
- `.addEventListener()` = JavaScript method that registers event listeners
- `'scroll'` = The **event type** to listen for (built-in browser event)
- `handleScroll` = The **callback function** to run when scroll happens

**How JavaScript knows 'scroll' is an event:**

- Scroll is a **standard browser event** that exists automatically
- The browser detects when users scroll and fires the 'scroll' event
- By using `addEventListener`, you tell JavaScript: _"Run my function whenever scrolling happens"_

**Built-in Browser Events:**

```
'scroll'    - User scrolls page
'click'     - User clicks element
'change'    - Form input changes
'hover'     - Mouse over element
'resize'    - Window resizes
```

#### Lines 10-13: Cleanup Function

```tsx
return () => {
  window.removeEventListener('scroll', handleScroll);
};
```

**Purpose**: This is the **cleanup function** that runs when the component is removed from the DOM.

**Why is cleanup important?**

Without cleanup:

```
Scenario: You create component 10 times
❌ 10 scroll listeners are added
❌ Old listeners never removed
❌ Memory wastes (memory leak)
❌ Performance gets slower
```

With cleanup:

```
Scenario: You create component 10 times
✅ Listener added each time
✅ Listener removed when component removed
✅ No wasted memory
✅ Performance stays good
```

**Analogy**: It's like hiring a security guard:

- `addEventListener` = Hire a guard
- `removeEventListener` = Fire the guard when you leave

#### Line 14: Dependency Array

```tsx
}, []);
```

**The dependency array** controls **WHEN** the useEffect runs.

| Syntax       | When it runs                 | Use case                      |
| ------------ | ---------------------------- | ----------------------------- |
| `[]`         | Only once on component mount | Initial setup (our case)      |
| `[isSticky]` | When `isSticky` changes      | Not here - would create loop! |
| No array     | Every render (BAD!)          | Avoid this                    |

**Why empty `[]`?**

- We only want to add the scroll listener **one time**
- If we didn't have it, the listener would be added 100+ times!
- The listener stays active the entire time component exists
- When component is removed, cleanup runs automatically

---

## How States and Effects Work Together

```
TIMELINE OF EXECUTION
────────────────────────────────────────────

1. Component First Loads
   ├─ useState initializes: isSticky = false
   └─ useEffect runs (because of [])

2. useEffect Execution
   ├─ Creates handleScroll function
   ├─ Adds scroll event listener
   └─ Returns cleanup function

3. User Scrolls Down
   ├─ Browser detects 'scroll' event
   ├─ Runs handleScroll function
   ├─ Checks: window.scrollY > 100?
   │  ├─ YES → setIsSticky(true)
   │  │         React re-renders with new state
   │  │         JSX applies 'fixed' classes ✨
   │  └─ NO → setIsSticky(false)
   │          React re-renders with new state
   │          JSX applies 'relative' classes
   └─ User sees header position change

4. User Scrolls Back Up (< 100px)
   ├─ handleScroll runs again
   ├─ Checks: window.scrollY > 100?
   ├─ FALSE → setIsSticky(false)
   └─ Header goes back to normal position

5. Component Removed
   ├─ Cleanup function runs
   ├─ removeEventListener removes scroll listener
   └─ No memory leaks! ✅
```

---

## JSX Implementation - How State Affects Rendering

### Main Container - Fixed vs Relative

```tsx
<div className={`w-full transition-all duration-300
  ${isSticky ? 'fixed top-0 left-0 z-[100] bg-white shadow-lg' : 'relative'}`}>
```

**This is a conditional class application:**

```
isSticky = false → className = 'relative'
isSticky = true  → className = 'fixed top-0 left-0 z-[100] bg-white shadow-lg'
```

**Classes When NOT Sticky:**

```css
relative  /* Normal document flow, scrolls with page */
```

**Classes When Sticky:**

```css
fixed         /* Fixed to viewport */
top-0 left-0  /* Position at top-left corner */
z-[100]       /* Layer high (stays above content) */
bg-white      /* White background */
shadow-lg     /* Drop shadow for depth */
```

### Conditional Content Rendering

```tsx
{
  isSticky && <div className="flex items-center gap-8">{/* User icons, wishlist, cart only show when sticky */}</div>;
}
```

**This syntax:**

- `isSticky && (...)` = "Only render this IF isSticky is true"
- When `isSticky = false`, this entire section is hidden
- When `isSticky = true`, user icons appear at the right

### Dropdown Position Adjustment

```tsx
<div className={`... ${isSticky ? 'top-[70px]' : 'top-[50px]'} ...`}>
```

**Why different positions?**

- When NOT sticky: Button is 50px tall, dropdown starts at `top-[50px]`
- When sticky: Header is 70px tall (with padding), dropdown starts at `top-[70px]`
- This ensures dropdown always appears **below** the button!

---

## Potential Improvements

### 1. Performance Optimization

**Current**: Calls `setIsSticky` on every scroll (can be 100+ times per second!)

**Optimized Version** (Debounced):

```tsx
useEffect(() => {
  let timeoutId;

  const handleScroll = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    }, 100); // Only check every 100ms
  };

  window.addEventListener('scroll', handleScroll);
  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener('scroll', handleScroll);
  };
}, []);
```

### 2. Extract to Custom Hook

```tsx
// hooks/useSticky.ts
export const useSticky = (threshold = 100) => {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return isSticky;
};

// In component:
const isSticky = useSticky(100);
```

---

## Common Mistakes to Avoid

### ❌ Wrong: Using window.screenY

```tsx
if (window.screenY > 100) {
  // WRONG! Never changes
  setIsSticky(true);
}
```

### ✅ Correct: Using window.scrollY

```tsx
if (window.scrollY > 100) {
  // CORRECT! Changes on scroll
  setIsSticky(true);
}
```

### ❌ Wrong: Missing Cleanup

```tsx
useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  // Missing removeEventListener! Memory leak!
}, []);
```

### ✅ Correct: With Cleanup

```tsx
useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, []);
```

### ❌ Wrong: Calling setState every render

```tsx
const [isSticky, setIsSticky] = useState(false);

// In component body (NO useEffect!)
if (window.scrollY > 100) {
  setIsSticky(true); // Infinite loop!
}
```

### ✅ Correct: Using useEffect

```tsx
const [isSticky, setIsSticky] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    if (window.scrollY > 100) {
      setIsSticky(true);
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

---

## Testing the Implementation

### Manual Testing Steps

1. **Open application** in browser
2. **Scroll down slowly**
   - At ~100px: Header should snap to top and stay fixed ✓
   - Background should go white ✓
   - Shadow should appear ✓
3. **Continue scrolling**
   - Header should remain at top ✓
   - User icons should be visible ✓
4. **Scroll back up** to top
   - At 100px: Header should return to relative position ✓
   - User icons should disappear ✓

### Browser DevTools Check

1. Open DevTools (F12)
2. Go to **Console** tab
3. Paste:

```javascript
window.addEventListener('scroll', () => {
  console.log('scrollY:', window.scrollY);
});
```

4. Scroll and watch the values in console
5. Should see values change from 0 → 50 → 100 → 150 etc.

---

## Summary Table

| Concept               | Purpose                  | Key Point                         |
| --------------------- | ------------------------ | --------------------------------- |
| `useState`            | Remember component data  | Trigger re-render when updated    |
| `useEffect`           | Run code after rendering | Perfect for event listeners       |
| `window.scrollY`      | Get scroll position      | Returns pixels scrolled           |
| `addEventListener`    | Listen for events        | Runs callback on event            |
| Dependency Array `[]` | Control when effect runs | Once on mount, cleanup on unmount |
| Cleanup Function      | Remove listeners/cleanup | Prevents memory leaks             |
| Conditional Classes   | Show/hide based on state | `{state && (...)}`                |

---

## Related Files

- Component: `apps/user-ui/src/shared/widgets/HeaderBottom.tsx`
- Parent Layout: `apps/user-ui/src/app/layout.tsx`
- Constants: `apps/user-ui/src/configs/constants.ts`

---

## References

- [React Hooks Documentation](https://react.dev/reference/react)
- [useState Hook](https://react.dev/reference/react/useState)
- [useEffect Hook](https://react.dev/reference/react/useEffect)
- [MDN - addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
- [MDN - window.scrollY](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollY)

---

**Last Updated**: February 17, 2026  
**Author**: Documentation Team  
**Version**: 1.0

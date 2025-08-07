# Standardized Toolbox Design System

## 📋 Overview

This document outlines the standardized professional toolbox design system for all Konva canvas components. The design is inspired by Adobe's professional tools and provides a consistent, polished user experience across all drawing/canvas interfaces.

## 🎨 Design Philosophy

### Adobe-Style Professional Look
- **Gradient backgrounds** with subtle depth
- **Inset shadows** for professional appearance
- **Smooth hover transitions** with transform effects
- **Consistent color palette** using professional gray tones
- **Responsive design** that works on all screen sizes

### Key Design Principles
1. **Consistency** - All toolboxes use the same visual language
2. **Professionalism** - Polished, production-ready appearance
3. **Usability** - Clear visual hierarchy and intuitive interactions
4. **Modularity** - Reusable components and styles
5. **Accessibility** - Proper contrast and keyboard navigation

## 🛠️ Components

### 1. StandardToolbox.vue
The main container component that provides the structure:

```vue
<template>
  <StandardToolbox>
    <template #toolbar-groups>
      <!-- Your toolbar content goes here -->
    </template>

    <template #canvas>
      <!-- Your canvas content goes here -->
    </template>
  </StandardToolbox>
</template>
```

### 2. StandardToolboxStyles.vue
Global styles component that provides all CSS classes:

```vue
<script setup>
import StandardToolboxStyles from '@/components/konva/StandardToolboxStyles.vue'
</script>

<template>
  <StandardToolboxStyles />
  <!-- Your component content -->
</template>
```

## 🎯 Usage Examples

### Basic Toolbar Structure
```vue
<template>
  <StandardToolbox>
    <template #toolbar-groups>
      <!-- Dimension Controls -->
      <div class="toolbar-group">
        <div class="input-group">
          <RulerIcon class="input-icon" />
          <input v-model="length" type="number" class="toolbar-input" />
          <span class="input-unit">m</span>
        </div>

        <div class="input-group">
          <MoveIcon class="input-icon" />
          <input v-model="width" type="number" class="toolbar-input" />
          <span class="input-unit">m</span>
        </div>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Zoom Controls -->
      <div class="toolbar-group">
        <button @click="zoomOut" class="toolbar-button">
          <ZoomOutIcon class="button-icon" />
        </button>
        <div class="zoom-display">{{ zoomLevel }}%</div>
        <button @click="zoomIn" class="toolbar-button">
          <ZoomInIcon class="button-icon" />
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Text Options -->
      <div class="toolbar-group">
        <div class="checkbox-group">
          <input id="showName" v-model="showName" type="checkbox" class="checkbox-input" />
          <label for="showName" class="checkbox-label">Namn</label>
        </div>

        <div class="checkbox-group">
          <input id="showOwner" v-model="showOwner" type="checkbox" class="checkbox-input" />
          <label for="showOwner" class="checkbox-label">Ägare</label>
        </div>
      </div>
    </template>

    <template #canvas>
      <!-- Use same Tailwind classes as DetailPage.vue -->
      <div class="bg-white rounded-lg border canvas-container">
        <!-- Your Konva canvas here -->
      </div>
    </template>
  </StandardToolbox>
</template>
```

### Test/Action Buttons
```vue
<div class="toolbar-group">
  <span class="test-label">Visuella tillstånd:</span>

  <button @click="setVisualState('normal')" class="test-button">
    <div class="test-icon green-test">✓</div>
  </button>

  <button @click="setVisualState('marginCollision')" class="test-button">
    <div class="test-icon orange-test">⚠</div>
  </button>

  <button @click="setVisualState('hullCollision')" class="test-button">
    <div class="test-icon red-test">✗</div>
  </button>

  <button @click="setVisualState('placed')" class="test-button">
    <div class="test-icon blue-test">■</div>
  </button>

  <button @click="setVisualState('reserved')" class="test-button">
    <div class="test-icon light-gray-test">◐</div>
  </button>
</div>
```

## 🎨 CSS Classes Reference

### Layout Classes
- `.toolbar-group` - Groups related toolbar elements
- `.toolbar-separator` - Vertical separator line between groups
- `.input-group` - Container for input fields with icons
- `.checkbox-group` - Container for checkbox with label

### Input Classes
- `.toolbar-input` - Styled input field
- `.input-icon` - Icon inside input group
- `.input-unit` - Unit label (m, px, etc.)
- `.toolbar-label` - General label styling

### Button Classes
- `.toolbar-button` - Standard toolbar button
- `.test-button` - Action/test button
- `.button-icon` - Icon inside button

### Checkbox Classes
- `.checkbox-input` - Custom styled checkbox
- `.checkbox-label` - Checkbox label

### Display Classes
- `.zoom-display` - Zoom percentage display
- `.test-label` - Label for test button groups
- `.test-icon` - Icon inside test buttons

### Color Classes for Test Icons
- `.green-test` - Green (normal/success state)
- `.orange-test` - Orange (warning/margin collision)
- `.red-test` - Red (error/hull collision)
- `.blue-test` - Blue (placed/active state)
- `.light-gray-test` - Light gray (reserved state)
- `.gray-test` - Gray (neutral/reset state)

## 🖥️ Canvas Container

### Standard Canvas Setup
```vue
<template #canvas>
  <!-- Use same Tailwind classes as DetailPage.vue for consistency -->
  <div class="bg-white rounded-lg border canvas-container">
    <div class="konva-canvas" style="width: 700px; height: 700px;">
      <!-- Konva Stage mounts here -->
    </div>
  </div>
</template>
```

### Canvas Styling Guidelines
- **Container**: Uses Tailwind classes `bg-white rounded-lg border` (same as DetailPage.vue)
- **Padding**: 2rem around the canvas for breathing room (from StandardToolbox)
- **Background**: Light gray (#f5f5f5) outer area, white canvas container
- **Border**: Thin 1px border via Tailwind `border` class
- **Border radius**: `rounded-lg` (0.5rem)
- **Consistency**: Matches DetailPage.vue white containers exactly

## 📱 Responsive Design

### Mobile Adaptations
- Toolbar groups stack vertically on mobile
- Input fields become wider for touch interaction
- Buttons get slightly smaller but remain accessible
- Separators are hidden on mobile to save space

### Breakpoints
- **Desktop**: > 768px (horizontal layout)
- **Mobile**: ≤ 768px (vertical layout)

## 🎯 Implementation Checklist

### For New Konva Components:
1. ✅ Import `StandardToolbox.vue` as main container
2. ✅ Import `StandardToolboxStyles.vue` for CSS classes
3. ✅ Use predefined CSS classes for consistency
4. ✅ Structure toolbar content in logical groups
5. ✅ Add separators between different tool groups
6. ✅ Use consistent icon sizing and colors
7. ✅ Test responsive behavior on mobile
8. ✅ Ensure proper keyboard navigation
9. ✅ Add tooltips for complex buttons
10. ✅ Test all interactive states (hover, active, disabled)

## 🎨 Color Palette

### Primary Colors
- **Background**: `#f8f9fa` to `#e9ecef` (gradient)
- **Borders**: `#adb5bd` to `#6c757d`
- **Text**: `#495057`
- **Accent**: `#2563eb` (blue for active states)

### State Colors
- **Success/Normal**: `#d4edda` background, `#155724` text
- **Warning**: `#fff3cd` background, `#856404` text
- **Error**: `#f8d7da` background, `#721c24` text
- **Info**: `#d1ecf1` background, `#0c5460` text
- **Neutral**: `#f3f4f6` background, `#6b7280` text

## 🔧 Customization

### Adding New Tool Types
1. Create new CSS classes following the naming convention
2. Add to StandardToolboxStyles.vue
3. Update this documentation
4. Test across all screen sizes

### Icon Guidelines
- Use Lucide Vue Next icons for consistency
- Standard size: 1rem (16px)
- Stroke width: 1.5
- Color: `#6c757d` for inputs, `#495057` for buttons

## 📚 Examples in Codebase

### Current Implementations
- `BoatDetailCanvas.vue` - Complete implementation showing all features
- `BoatCanvasTest.vue` - Test page with StandardToolbox container

### Future Implementations
- `StorageDesigner.vue` - For designing storage layouts
- `PlacementCanvas.vue` - For boat placement management
- `RestrictionZoneEditor.vue` - For editing restricted areas

## 🎯 Benefits

### Development Benefits
- **Faster development** - Reusable components and styles
- **Consistency** - All toolboxes look and behave the same
- **Maintainability** - Changes in one place affect all toolboxes
- **Testing** - Standard patterns make testing easier

### User Benefits
- **Familiar interface** - Consistent experience across all tools
- **Professional appearance** - Polished, production-ready look
- **Intuitive interactions** - Predictable behavior patterns
- **Accessibility** - Proper contrast and keyboard navigation

## 📝 Maintenance

### Regular Updates
- Review and update colors based on accessibility guidelines
- Add new component types as needed
- Update documentation with new examples
- Test with new browser versions

### Version Control
- Changes to StandardToolboxStyles.vue affect all components
- Test thoroughly before committing style changes
- Document breaking changes in changelog
- Maintain backwards compatibility when possible

---

*Last updated: 2024-01-XX*
*Version: 1.0.0*
*Maintainer: Development Team*

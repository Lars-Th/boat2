<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ref } from 'vue'
import DashboardCard from '@/components/custom/DashboardCard.vue'

const testInput = ref('')
const testTextarea = ref('')
const progressValue = ref(33)
const counter = ref(0)

const incrementCounter = () => {
  counter.value++
}

const updateProgress = () => {
  progressValue.value = Math.min(progressValue.value + 10, 100)
  if (progressValue.value >= 100) {
    progressValue.value = 0
  }
}
</script>

<template>
  <div class="p-4 space-y-4">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Test Page</h1>
      <p class="text-muted-foreground">Interactive components for testing functionality</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Interactive Elements -->
      <DashboardCard
        title="Interactive Elements"
        description="Test various UI components"
      >
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="test-input">Test Input</Label>
            <Input 
              id="test-input" 
              v-model="testInput" 
              placeholder="Type something here..." 
            />
            <p class="text-sm text-muted-foreground">
              You typed: {{ testInput || 'Nothing yet...' }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="test-textarea">Test Textarea</Label>
            <Textarea 
              id="test-textarea" 
              v-model="testTextarea" 
              placeholder="Enter a longer message..."
              rows="3"
            />
          </div>

          <div class="flex space-x-2">
            <Button @click="incrementCounter">
              Counter: {{ counter }}
            </Button>
            <Button variant="outline" @click="counter = 0">
              Reset
            </Button>
          </div>
        </div>
      </DashboardCard>

      <!-- Progress and Status -->
      <DashboardCard
        title="Progress & Status"
        description="Visual feedback components"
      >
        <div class="space-y-4">
          <div class="space-y-2">
            <div class="flex justify-between">
              <Label>Progress Bar</Label>
              <span class="text-sm text-muted-foreground">{{ progressValue }}%</span>
            </div>
            <Progress :model-value="progressValue" class="w-full" />
            <Button @click="updateProgress" class="w-full">
              Update Progress
            </Button>
          </div>

          <div class="space-y-2">
            <Label>Status Badges</Label>
            <div class="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </div>
        </div>
      </DashboardCard>
    </div>

    <!-- Button Variants -->
    <DashboardCard
      title="Button Variants"
      description="Different button styles and sizes"
      full-width
    >
      <div class="space-y-4">
        <div>
          <Label class="text-sm font-medium">Variants</Label>
          <div class="flex flex-wrap gap-2 mt-2">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </div>

        <div>
          <Label class="text-sm font-medium">Sizes</Label>
          <div class="flex flex-wrap items-center gap-2 mt-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">🎯</Button>
          </div>
        </div>
      </div>
    </DashboardCard>

    <!-- Test Results -->
    <DashboardCard
      title="Test Results"
      description="Summary of current test values"
      full-width
    >
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center p-4 border rounded-lg">
          <h3 class="font-semibold">Counter Value</h3>
          <p class="text-2xl font-bold text-primary">{{ counter }}</p>
        </div>
        <div class="text-center p-4 border rounded-lg">
          <h3 class="font-semibold">Progress</h3>
          <p class="text-2xl font-bold text-primary">{{ progressValue }}%</p>
        </div>
        <div class="text-center p-4 border rounded-lg">
          <h3 class="font-semibold">Input Length</h3>
          <p class="text-2xl font-bold text-primary">{{ testInput.length }}</p>
        </div>
      </div>
    </DashboardCard>
  </div>
</template>

<style scoped>
/* Component-specific styles if needed */
</style> 
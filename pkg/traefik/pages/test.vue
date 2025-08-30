<template>
  <div class="test-component">
    <h1>Test Component</h1>
    <p>This is a basic test component</p>
  </div>
</template>

<script>
export default {
  name: 'TestComponent',
  data() {
    return {
      message: 'Hello from test component'
    }
  }
}
</script>

<style lang="scss" scoped>
.test-component {
  padding: 20px;
  
  h1 {
    color: var(--primary);
    margin-bottom: 10px;
  }
}
</style>

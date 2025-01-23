<template>
  <div class="tree-item">
    <div class="node-name">{{ node.name }}</div>
    <div v-if="node.child && node.child.length" class="children">
      <TreeItem
        v-for="(child, index) in node.child"
        :key="index"
        :node="child"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: "TreeItem",
  props: {
    node: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped>
.tree-item {
  margin-left: 20px;
}
.node-name {
  font-weight: bold;
}
.children {
  margin-left: 20px;
}
</style>

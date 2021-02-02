<template></template>

<script lang="ts">
import { BehaviorSubject } from "rxjs";
import Form from "./logic/form/Form";
export default {
  name: "App",
  setup() {
    const form = new Form(new BehaviorSubject({}), {});
  },
};
</script>

<style>
</style>
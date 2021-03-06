'use strict';

const fs       = require('fs');
const NodeGit  = require('nodegit');
const path     = require('path');
const Vue      = require('vue/dist/vue');

const fileDiff = require('./file-diff');
const toolbar  = require('./toolbar');

Vue.component('file-status', {
  props: [
    'activeRepository',
    'isIndexView',
    'file'
  ],
  data: function () {
    return {
      active: false,
      buttons: [{
        label: 'Refresh',
        className: 'refresh',
        iconClass: 'fa fa-refresh',
        click: () => this.$refs.fileDiff.refresh()
      }]
    };
  },
  methods: {
    activate: function () {
      this.active = !this.active;
    },
    getLeft: async function () {
      return this.isIndexView ? this.getHeadContent() : this.getIndexContent();
    },
    getRight: async function () {
      return this.isIndexView ? this.getIndexContent() : this.getWorkingContent();
    },
    getHeadContent: async function () {
      const repo   = await NodeGit.Repository.open(this.activeRepository.path);
      const commit = await repo.getHeadCommit();
      const entry  = await commit.getEntry(this.file.path());
      const blob   = await entry.getBlob();

      return blob.toString();
    },
    getIndexContent: async function () {
      const repo   = await NodeGit.Repository.open(this.activeRepository.path);
      const index  = await repo.refreshIndex();
      const oid    = index.getByPath(this.file.path()).id;
      const blob   = await repo.getBlob(oid);

      return blob.toString();
    },
    getWorkingContent: async function () {
      const fullPath = path.join(this.activeRepository.path, this.file.path());
      return new Promise(resolve => {
        fs.readFile(fullPath, 'utf8', (error, data) => resolve(data));
      });
    }
  },
  template: `
    <div v-bind:class="['file-status', { active: active }]">
      <div class="header" v-on:click="activate">
        <span class="filename">
          <i v-bind:class="['fa', { 'fa-caret-right': !active, 'fa-caret-down': active }]"></i>
          {{ file.path() }}
        </span>
        <toolbar v-bind:buttons="buttons"></toolbar>
      </div>
      <file-diff
        ref="fileDiff"
        v-if="active"
        v-bind:getLeft="getLeft"
        v-bind:getRight="getRight">
      </file-diff>
    </div>
  `
});
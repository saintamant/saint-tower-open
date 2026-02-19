import { Office } from '@/types/office';

export const offices: Office[] = [
  {
    id: 'sa-core',
    name: 'SA Core',
    type: 'main',
    color: '#00ff88',
    githubOrg: 'demo-org',
  },
  {
    id: 'project-a',
    name: 'Project A',
    type: 'sub',
    parentId: 'sa-core',
    color: '#ffaa00',
    githubOrg: 'ProjectA-demo',
  },
  {
    id: 'project-b',
    name: 'Project B',
    type: 'sub',
    parentId: 'sa-core',
    color: '#88aaff',
    githubOrg: 'ProjectB-demo',
  },
  {
    id: 'project-c',
    name: 'Project C',
    type: 'independent',
    color: '#4488ff',
    githubOrg: 'ProjectC-demo',
  },
  {
    id: 'project-d',
    name: 'Project D',
    type: 'independent',
    color: '#ffdd44',
    githubOrg: 'ProjectD-demo',
  },
  {
    id: 'project-e',
    name: 'Project E',
    type: 'independent',
    color: '#44ddaa',
    githubOrg: 'ProjectE-demo',
  },
  {
    id: 'lab',
    name: 'Lab',
    type: 'independent',
    color: '#ff4488',
  },
  {
    id: 'library',
    name: 'Library',
    type: 'independent',
    color: '#00bcd4',
  },
];

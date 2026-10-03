import { createRouter, createWebHashHistory } from 'vue-router';
import Exam from './views/Exam.vue';
import History from './views/History.vue';
import Home from './views/Home.vue';
import ParentHome from './views/parent/ParentHome.vue';
import ProfilePicker from './views/ProfilePicker.vue';
import Result from './views/Result.vue';
import Review from './views/Review.vue';
import Settings from './views/Settings.vue';
import WrongBook from './views/WrongBook.vue';
import ZhuyinCalibrate from './views/ZhuyinCalibrate.vue';

const routes = [
  { path: '/', redirect: '/profiles' },
  { path: '/profiles', component: ProfilePicker },
  { path: '/home', component: Home },
  { path: '/exam', component: Exam },
  { path: '/review', component: Review },
  { path: '/result', component: Result },
  { path: '/wrong', component: WrongBook },
  { path: '/history', component: History },
  { path: '/calibrate', component: ZhuyinCalibrate },
  { path: '/settings', component: Settings },
  { path: '/parent', component: ParentHome }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes
});

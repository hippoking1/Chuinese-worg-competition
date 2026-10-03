import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getLocalPlayers, saveLocalPlayers } from '../lib/db';
import { generateSalt, hashPin } from '../lib/pin';
import type { Player } from '../types';

export const usePlayerStore = defineStore('player', () => {
  const players = ref<Player[]>([]);
  const currentPlayer = ref<Player | null>(null);
  const isParentAuthenticated = ref<boolean>(false);
  const parentPinHash = ref<string>(localStorage.getItem('quiz_parent_pin_hash') || '');
  const parentSalt = ref<string>(localStorage.getItem('quiz_parent_salt') || 'parent_salt_default');

  async function loadPlayers() {
    let list = await getLocalPlayers();
    if (list.length === 0) {
      // Create initial sample kid profile so user can immediately play
      const salt = generateSalt();
      const pinH = await hashPin('1234', salt);
      const defaultKid: Player = {
        id: 'player_1',
        nickname: '小達人',
        avatar: 'owl',
        pinHash: pinH,
        salt,
        createdAt: new Date().toISOString()
      };
      list = [defaultKid];
      await saveLocalPlayers(list);
    }
    players.value = list;

    // Check if previous session player is saved
    const savedPid = sessionStorage.getItem('quiz_active_pid');
    if (savedPid) {
      const p = list.find(x => x.id === savedPid);
      if (p) currentPlayer.value = p;
    }
  }

  async function verifyPin(player: Player, pin: string): Promise<boolean> {
    const hash = await hashPin(pin, player.salt);
    return hash === player.pinHash;
  }

  function selectPlayer(player: Player) {
    currentPlayer.value = player;
    sessionStorage.setItem('quiz_active_pid', player.id);
  }

  function logout() {
    currentPlayer.value = null;
    sessionStorage.removeItem('quiz_active_pid');
    isParentAuthenticated.value = false;
  }

  async function createPlayer(nickname: string, avatar: string, pin: string): Promise<Player> {
    const salt = generateSalt();
    const pinH = await hashPin(pin, salt);
    const newPlayer: Player = {
      id: 'player_' + Date.now(),
      nickname,
      avatar,
      pinHash: pinH,
      salt,
      createdAt: new Date().toISOString()
    };
    players.value.push(newPlayer);
    await saveLocalPlayers(players.value);
    return newPlayer;
  }

  async function deletePlayer(id: string) {
    players.value = players.value.filter(p => p.id !== id);
    await saveLocalPlayers(players.value);
    if (currentPlayer.value?.id === id) {
      logout();
    }
  }

  async function setParentPin(pin: string) {
    const salt = generateSalt();
    const hash = await hashPin(pin, salt);
    parentPinHash.value = hash;
    parentSalt.value = salt;
    localStorage.setItem('quiz_parent_pin_hash', hash);
    localStorage.setItem('quiz_parent_salt', salt);
  }

  async function verifyParentPin(pin: string): Promise<boolean> {
    if (!parentPinHash.value) {
      // First time: set given pin as parent pin
      await setParentPin(pin);
      isParentAuthenticated.value = true;
      return true;
    }
    const hash = await hashPin(pin, parentSalt.value);
    if (hash === parentPinHash.value) {
      isParentAuthenticated.value = true;
      return true;
    }
    return false;
  }

  return {
    players,
    currentPlayer,
    isParentAuthenticated,
    parentPinHash,
    loadPlayers,
    verifyPin,
    selectPlayer,
    logout,
    createPlayer,
    deletePlayer,
    setParentPin,
    verifyParentPin
  };
});

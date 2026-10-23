// Shared between the room (the 3D home screen) and the page: whether the room is loaded and ready to
// step back into, and how to get there.

export const room = $state({
	ready: false,
	open: () => {}
});

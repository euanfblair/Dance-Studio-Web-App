const express = require('express');
const controllers = require('../controllers/danceControllers');
const { login, verify } = require('../auth/auth');
const { notFound, serverError } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/', controllers.landing_page);
router.get('/login', controllers.admin_login);
router.post('/login', login, controllers.handle_login);
router.get('/logout', controllers.logout);

router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us - Dance Studio',
    about: true
  });
});

router.get('/courses', controllers.courses);
router.get('/courses/:id', controllers.courseDetails);
router.post('/book-class', controllers.bookClass);
router.post('/course/book-course', controllers.bookCourse);

router.get('/admin', verify, controllers.admin_dashboard); 

router.get('/admin/new', verify, controllers.create_new_admin);
router.post('/admin/new', verify, controllers.post_create_new_admin);
router.get('/admin/users', verify, controllers.manage_admins);
router.post('/admin/users/:id/delete', verify, controllers.delete_admin);

router.get('/admin/courses/', verify, controllers.edit_courses);
router.post('/admin/courses/update', verify, controllers.post_update_course);
router.post('/admin/courses/create', verify, controllers.post_create_course);
router.post('/admin/courses/:id/delete', verify, controllers.delete_course);

router.get('/admin/courses/:id/classes', verify, controllers.admin_course_classes);
router.post('/admin/classes/update', verify, controllers.post_update_class);
router.post('/admin/classes/create', verify, controllers.post_create_class);
router.post('/admin/classes/:id/delete', verify, controllers.delete_class);
router.post('/admin/bookings/remove', verify, controllers.remove_booking);

router.get('/api/classes/:id/bookings', verify, controllers.get_class_bookings);

router.use(notFound);
router.use(serverError);

module.exports = router;
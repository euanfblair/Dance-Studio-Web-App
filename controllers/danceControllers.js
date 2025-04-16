const danceDAO = require('../models/danceModel');
const userDAO = require('../models/userModel');

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const landing_page = (req, res) => {
  res.render('home', {
    title: 'Dance Class Booking',
  });
};

const courses = async (req, res) => {
  try {
    const courses = await danceDAO.getAllCourses();
    res.render('courses', {
      title: 'Dance Class Booking',
      courses,
    });
  } catch (error) {
    res.status(500).render('error', {
      message: 'Failed to load courses. Please try again later.',
    });
  }
};

const courseDetails = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const course = await danceDAO.getCourseById(courseId);

    if (!course) {
      return res.status(404).render('error', {
        message: 'Course not found',
      });
    }

    const classes = await danceDAO.getClassesByCourseId(courseId);

    const formattedClasses = classes.map((classItem) => {
      const formattedClass = { ...classItem, courseId };

      if (classItem.date) {
        formattedClass.formattedDate = formatDate(classItem.date);
      }

      return formattedClass;
    });
    
    const hasFullClasses = classes.some(classItem => classItem.spacesRemaining <= 0);
    const totalPrice = classes.reduce((sum, classItem) => sum + (classItem.price || 0), 0);

    res.render('courseDetails', {
      title: `${course.name} - Dance Class Booking`,
      course,
      classes: formattedClasses,
      hasFullClasses,
      totalPrice: totalPrice.toFixed(2)
    });
  } catch (error) {

    res.status(500).render('error', {
      message: 'Failed to load course details. Please try again later.',
    });
  }
};

const bookClass = async (req, res) => {
  try {
    const { classId, courseId, name, email, phone } = req.body;

    const bookingInfo = {
      customerName: name,
      customerEmail: email,
      customerPhone: phone || '',
    };

    try {
      await danceDAO.bookClass(classId, bookingInfo);

      if (req.flash) {
        req.flash('success', 'Your class has been successfully booked!');
      }
    } catch (bookingError) {
      if (req.flash) {
        if (bookingError.message.includes('already booked')) {
          req.flash('error', bookingError.message);
        } else if (bookingError.message.includes('No spaces remaining')) {
          req.flash(
            'error',
            'This class is now fully booked. Please select another class.',
          );
        } else {
          req.flash(
            'error',
            `Unable to complete booking: ${bookingError.message}`,
          );
        }
      }
    }

    return res.redirect(`/courses/${courseId}`);
  } catch (error) {


    if (req.flash) {
      req.flash(
        'error',
        'An unexpected error occurred. Please try again later.',
      );
    }

    return res.redirect('/courses');
  }
};

const bookCourse = async (req, res) => {
  try {
    const { courseId, name, email, phone } = req.body;

    const bookingInfo = {
      customerName: name,
      customerEmail: email,
      customerPhone: phone || ''
    };

    try {
      const result = await danceDAO.bookEntireCourse(courseId, bookingInfo);

      if (req.flash) {
        if (result.success) {
          req.flash(
            'success', 
            `Successfully booked ${result.successfulBookings} out of ${result.totalClasses} classes for this course.`
          );
          
          if (result.failedBookings.length > 0) {
            const failureReasons = result.failedBookings.map(booking => {
              const formattedDate = formatDate(booking.date);
              return `${formattedDate} (${booking.time}): ${booking.error}`;
            });
            
            req.flash(
              'error',
              `The following classes couldn't be booked: ${failureReasons.join('; ')}`
            );
          }
        } else {
          req.flash('error', 'Failed to book classes for this course.');
        }
      }
    } catch (bookingError) {
      if (req.flash) {
        req.flash(
          'error',
          `Unable to complete course booking: ${bookingError.message}`
        );
      }
    }

    return res.redirect(`/courses/${courseId}`);
  } catch (error) {


    if (req.flash) {
      req.flash(
        'error',
        'An unexpected error occurred. Please try again later.'
      );
    }

    return res.redirect('/courses');
  }
};

const admin_login = (req, res) => {
  res.render('login', {
    title: 'Admin Login',
  });
};

const handle_login = (req, res) => {};

const logout = (req, res) => {
  res.clearCookie('jwt').status(200).redirect('/');
};

const admin_dashboard = async (req, res) => {
  try {
    const courses = await danceDAO.getAllCourses();
    const courseCount = courses.length;

    let classCount = 0;
    let bookingCount = 0;
    let allClasses = [];
    
    for (const course of courses) {
      const classes = await danceDAO.getClassesByCourseId(course._id);
      classCount += classes.length;
      allClasses = [...allClasses, ...classes];
      
      for (const classItem of classes) {
        if (classItem.bookings && Array.isArray(classItem.bookings)) {
          bookingCount += classItem.bookings.length;
        }
      }
    }
    
    const adminCount = await userDAO.getAdminCount();
    
    allClasses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recentClasses = allClasses.slice(0, 4);
    
    res.render('admin', {
      title: 'Admin Dashboard',
      stats: {
        courseCount,
        classCount,
        bookingCount,
        adminCount
      },
      recentClasses,
      courses,
      hasRecentClasses: recentClasses.length > 0
    });
  } catch (err) {
    req.flash('error', 'An error occurred while loading the admin dashboard');
    res.redirect('/login');
  }
};

const create_new_admin = (req, res) => {
  res.render('createAdmin', {
    title: 'Create New Admin',
    flash: req.flash()
  });
};

const post_create_new_admin = async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    req.flash('error', 'Username and password are required');
    return res.redirect('/admin/new');
  }
  
  if (password.length < 8) {
    req.flash('error', 'Password must be at least 8 characters long');
    return res.redirect('/admin/new');
  }
  
  try {
    await userDAO.create(username, password);
    req.flash('success', 'New admin created successfully');
    res.redirect('/admin/users');
  } catch (error) {
    req.flash('error', `Failed to create new admin: ${error.message}`);
    res.redirect('/admin/new');
  }
};

const manage_admins = async (req, res) => {
  try {
    const admins = await userDAO.getAllAdmins();
    
    res.render('manage-admins', {
      title: 'Manage Administrators',
      admins,
      flash: req.flash()
    });
  } catch (error) {
    req.flash('error', 'Failed to load administrators');
    res.redirect('/admin');
  }
};

const delete_admin = async (req, res) => {
  try {
    const { id: adminId } = req.params;
    
    if (!adminId) {
      req.flash('error', 'Administrator ID is required');
      return res.redirect('/admin/users');
    }
    
    const result = await userDAO.deleteAdmin(adminId);
    
    if (result.success) {
      req.flash('success', 'Administrator deleted successfully');
    } else {
      req.flash('error', 'Failed to delete administrator');
    }
    
    res.redirect('/admin/users');
  } catch (error) {
    req.flash('error', `Failed to delete administrator: ${error.message}`);
    res.redirect('/admin/users');
  }
};

const edit_courses = async (req, res) => {
  try {
    const courses = await danceDAO.getAllCourses();
    res.render('edit-courses', {
      title: 'Edit Courses',
      courses,
    });
  } catch (error) {
    res.status(500).render('error', {
      message: 'Failed to load courses. Please try again later.',
    });
  }
};

const post_update_course = async (req, res) => {
  try {
    const { courseId, name, duration } = req.body;
    
    if (!courseId) {
      req.flash('error', 'Course ID is required');
      return res.redirect('/admin/courses');
    }
    
    if (!name || !duration) {
      req.flash('error', 'Course name and duration are required');
      return res.redirect('/admin/courses');
    }
    
    const updateData = {
      name: name.trim(),
      duration: duration.trim()
    };
    
    const result = await danceDAO.updateCourse(courseId, updateData);
    
    if (result.success) {
      req.flash('success', 'Course updated successfully');
    } else {
      req.flash('error', 'Failed to update course');
    }
    
    res.redirect('/admin/courses');
  } catch (error) {
    req.flash('error', `Failed to update course: ${error.message}`);
    res.redirect('/admin/courses');
  }
};

const post_create_course = async (req, res) => {
  try {
    const { name, duration } = req.body;
    
    if (!name || !duration) {
      req.flash('error', 'Course name and duration are required');
      return res.redirect('/admin/courses');
    }
    
    const courseData = {
      name: name.trim(),
      duration: duration.trim()
    };
    
    const result = await danceDAO.createCourse(courseData);
    
    if (result.success) {
      req.flash('success', 'Course created successfully');
    } else {
      req.flash('error', 'Failed to create course');
    }
    
    res.redirect('/admin/courses');
  } catch (error) {
    req.flash('error', `Failed to create course: ${error.message}`);
    res.redirect('/admin/courses');
  }
};

const delete_course = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    
    if (!courseId) {
      req.flash('error', 'Course ID is required');
      return res.redirect('/admin/courses');
    }
    
    const result = await danceDAO.deleteCourse(courseId);
    
    if (result.success) {
      req.flash('success', 'Course and all associated classes deleted successfully');
    } else {
      req.flash('error', 'Failed to delete course');
    }
    
    res.redirect('/admin/courses');
  } catch (error) {
    req.flash('error', `Failed to delete course: ${error.message}`);
    res.redirect('/admin/courses');
  }
};

const admin_course_classes = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    
    const course = await danceDAO.getCourseById(courseId);
    
    if (!course) {
      req.flash('error', 'Course not found');
      return res.redirect('/admin/courses');
    }
    
    const classes = await danceDAO.getClassesByCourseId(courseId);
    
    const formattedClasses = classes.map((classItem) => {
      const formattedClass = { 
        ...classItem,
        courseId
      };
      
      if (classItem.date) {
        const date = new Date(classItem.date);
        formattedClass.formattedDate = formatDate(date);
        
        formattedClass.dateISO = date.toISOString().split('T')[0];
      }
      
      return formattedClass;
    });
    
    res.render('admin-course-classes', {
      title: `${course.name} - Classes Admin`,
      course,
      classes: formattedClasses
    });
  } catch (error) {
    req.flash('error', `Failed to load course classes: ${error.message}`);
    res.redirect('/admin/courses');
  }
};

const post_create_class = async (req, res) => {
  try {
    const { 
      courseId, 
      courseName, 
      date, 
      time, 
      description, 
      location, 
      price, 
      capacity 
    } = req.body;
    
    if (!courseId || !courseName || !date || !time || !description || !location || !price || !capacity) {
      req.flash('error', 'All fields are required');
      return res.redirect(`/admin/courses/${courseId}/classes`);
    }
    
    const classData = {
      courseName,
      date,
      time: time.trim(),
      description: description.trim(),
      location: location.trim(),
      price: parseFloat(price),
      capacity: parseInt(capacity, 10)
    };
    
    const result = await danceDAO.createClass(classData);
    
    if (result.success) {
      req.flash('success', 'Class created successfully');
    } else {
      req.flash('error', 'Failed to create class');
    }
    
    res.redirect(`/admin/courses/${courseId}/classes`);
  } catch (error) {
    const { courseId } = req.body;
    req.flash('error', `Failed to create class: ${error.message}`);
    res.redirect(`/admin/courses/${courseId}/classes`);
  }
};

const post_update_class = async (req, res) => {
  try {
    const { 
      classId, 
      courseId,
      date, 
      time, 
      description, 
      location, 
      price, 
      capacity 
    } = req.body;
    
    if (!classId || !courseId || !date || !time || !description || !location || !price || !capacity) {
      req.flash('error', 'All fields are required');
      return res.redirect(`/admin/courses/${courseId}/classes`);
    }
    
    const classData = await danceDAO.getClassById(classId);
    
    if (!classData) {
      req.flash('error', 'Class not found');
      return res.redirect(`/admin/courses/${courseId}/classes`);
    }
    
    const updateData = {
      date,
      time: time.trim(),
      description: description.trim(),
      location: location.trim(),
      price: parseFloat(price),
      capacity: parseInt(capacity, 10)
    };
    
    const result = await danceDAO.updateClass(classId, updateData);
    
    if (result.success) {
      req.flash('success', 'Class updated successfully');
    } else {
      req.flash('error', 'Failed to update class');
    }
    
    res.redirect(`/admin/courses/${courseId}/classes`);
  } catch (error) {
    const { courseId } = req.body;
    req.flash('error', `Failed to update class: ${error.message}`);
    res.redirect(`/admin/courses/${courseId}/classes`);
  }
};

const delete_class = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const { courseId } = req.query;
    
    if (!classId) {
      req.flash('error', 'Class ID is required');
      return res.redirect(`/admin/courses/${courseId}/classes`);
    }
    
    const result = await danceDAO.deleteClass(classId);
    
    if (result.success) {
      req.flash('success', 'Class deleted successfully');
    } else {
      req.flash('error', 'Failed to delete class');
    }
    
    if (courseId) {
      res.redirect(`/admin/courses/${courseId}/classes`);
    } else {
      res.redirect('/admin/courses');
    }
  } catch (error) {
    const { courseId } = req.query;
    req.flash('error', `Failed to delete class: ${error.message}`);
    
    if (courseId) {
      res.redirect(`/admin/courses/${courseId}/classes`);
    } else {
      res.redirect('/admin/courses');
    }
  }
};

const remove_booking = async (req, res) => {
  try {
    const { classId, bookingEmail, courseId } = req.body;
    
    if (!classId || !bookingEmail) {
      req.flash('error', 'Class ID and booking email are required');
      return res.redirect(courseId ? `/admin/courses/${courseId}/classes` : '/admin/courses');
    }
    
    const result = await danceDAO.removeBooking(classId, bookingEmail);
    
    if (result.success) {
      req.flash('success', 'Booking removed successfully');
    } else {
      req.flash('error', 'Failed to remove booking');
    }
    
    if (courseId) {
      res.redirect(`/admin/courses/${courseId}/classes`);
    } else {
      res.redirect('/admin/courses');
    }
  } catch (error) {
    const { courseId } = req.body;
    req.flash('error', `Failed to remove booking: ${error.message}`);
    
    if (courseId) {
      res.redirect(`/admin/courses/${courseId}/classes`);
    } else {
      res.redirect('/admin/courses');
    }
  }
};

const get_class_bookings = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const bookings = await danceDAO.getClassBookings(classId);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ 
      error: true, 
      message: error.message 
    });
  }
};

module.exports = {
  landing_page,
  courses,
  courseDetails,
  bookClass,
  bookCourse,
  admin_login,
  handle_login,
  admin_dashboard,
  logout,
  create_new_admin,
  post_create_new_admin,
  edit_courses,
  post_update_course,
  post_update_class,
  post_create_course,
  admin_course_classes,
  post_create_class,
  get_class_bookings,
  delete_course,
  delete_class,
  manage_admins,
  delete_admin,
  remove_booking
};
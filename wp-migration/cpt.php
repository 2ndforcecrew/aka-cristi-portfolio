<?php
/**
 * AKA.CRISTI — Custom Post Types & Taxonomy
 * ============================================================
 * WordPress 阶段参考文件（原型 v1.0 / v1.1 不读取此文件）。
 *
 * 注册三个 Custom Post Type：
 *   photography — 摄影作品（data.js kind === 'photo'）
 *   design      — 平面设计作品（data.js kind === 'design'）
 *   project     — 占位/长尾项目（如 GTR34 式 12 段全案）
 *
 * 一个共用 hierarchical taxonomy：
 *   project_category — 作品分类，对应 data.js 的 category 字段
 *
 * ACF 字段见同目录 acf-fields.json；设计 token 见 theme.json。
 * ============================================================
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * 注册 CPT + 共用 taxonomy。挂 init，一处到位。
 */
function aka_register_cpts() {

	/* ---------- CPT: photography ---------- */
	register_post_type( 'photography', array(
		'labels' => array(
			'name'          => 'Photography',
			'singular_name' => 'Photography',
			'add_new_item'  => 'Add New Photography',
			'edit_item'     => 'Edit Photography',
			'view_item'     => 'View Photography',
			'all_items'     => 'All Photography',
			'search_items'  => 'Search Photography',
			'not_found'     => 'No photography found.',
		),
		'public'       => true,
		'has_archive'  => true,
		'rewrite'      => array( 'slug' => 'photography' ),
		'supports'     => array( 'title', 'editor', 'thumbnail' ),
		'menu_icon'    => 'dashicons-camera',
		'show_in_rest' => true,
	) );

	/* ---------- CPT: design ---------- */
	register_post_type( 'design', array(
		'labels' => array(
			'name'          => 'Design',
			'singular_name' => 'Design',
			'add_new_item'  => 'Add New Design',
			'edit_item'     => 'Edit Design',
			'view_item'     => 'View Design',
			'all_items'     => 'All Design',
			'search_items'  => 'Search Design',
			'not_found'     => 'No designs found.',
		),
		'public'       => true,
		'has_archive'  => true,
		'rewrite'      => array( 'slug' => 'design' ),
		'supports'     => array( 'title', 'editor', 'thumbnail' ),
		'menu_icon'    => 'dashicons-art',
		'show_in_rest' => true,
	) );

	/* ---------- CPT: project ---------- */
	register_post_type( 'project', array(
		'labels' => array(
			'name'          => 'Project',
			'singular_name' => 'Project',
			'add_new_item'  => 'Add New Project',
			'edit_item'     => 'Edit Project',
			'view_item'     => 'View Project',
			'all_items'     => 'All Projects',
			'search_items'  => 'Search Projects',
			'not_found'     => 'No projects found.',
		),
		'public'       => true,
		'has_archive'  => true,
		'rewrite'      => array( 'slug' => 'project' ),
		'supports'     => array( 'title', 'editor', 'thumbnail' ),
		'menu_icon'    => 'dashicons-portfolio',
		'show_in_rest' => true,
	) );

	/* ---------- Taxonomy: project_category ---------- */
	register_taxonomy(
		'project_category',
		array( 'photography', 'design', 'project' ),
		array(
			'labels' => array(
				'name'              => 'Project Categories',
				'singular_name'     => 'Project Category',
				'add_new_item'      => 'Add New Project Category',
				'edit_item'         => 'Edit Project Category',
				'view_item'         => 'View Project Category',
				'all_items'         => 'All Project Categories',
				'search_items'      => 'Search Project Categories',
				'not_found'         => 'No project categories found.',
				'parent_item'       => 'Parent Project Category',
				'parent_item_colon' => 'Parent Project Category:',
			),
			'hierarchical' => true,
			'public'       => true,
			'rewrite'      => array( 'slug' => 'category' ),
			'show_in_rest' => true,
		)
	);
}
add_action( 'init', 'aka_register_cpts' );

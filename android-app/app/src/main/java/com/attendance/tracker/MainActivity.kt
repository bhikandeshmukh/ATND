package com.attendance.tracker

import android.Manifest
import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialException
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.attendance.tracker.ads.AdMobManager
import com.attendance.tracker.ads.BannerAdView
import com.attendance.tracker.data.model.UserRole
import com.attendance.tracker.ui.navigation.*
import com.attendance.tracker.ui.screens.attendance.AttendanceScreen
import com.attendance.tracker.ui.screens.employees.EmployeeScreen
import com.attendance.tracker.ui.screens.leaves.LeaveScreen
import com.attendance.tracker.ui.screens.login.LoginScreen
import com.attendance.tracker.ui.screens.login.LoginViewModel
import com.attendance.tracker.ui.screens.nightduty.NightDutyScreen
import com.attendance.tracker.ui.screens.notifications.NotificationScreen
import com.attendance.tracker.ui.screens.reports.ReportScreen
import com.attendance.tracker.ui.theme.AttendanceTrackerTheme
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    companion object {
        private const val TAG = "MainActivity"
        // Web Client ID from Firebase Console
        private const val WEB_CLIENT_ID = "861215517427-63vg3pj14c421gf042ftu6b6r5pibrra.apps.googleusercontent.com"
    }
    
    @Inject
    lateinit var adMobManager: AdMobManager
    
    private lateinit var credentialManager: CredentialManager
    private var loginViewModel: LoginViewModel? = null
    
    private val locationPermissionRequest = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        when {
            permissions.getOrDefault(Manifest.permission.ACCESS_FINE_LOCATION, false) -> {
                // Fine location granted
            }
            permissions.getOrDefault(Manifest.permission.ACCESS_COARSE_LOCATION, false) -> {
                // Coarse location granted
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize AdMob
        adMobManager.initialize()
        
        // Initialize Credential Manager for Google Sign-In
        credentialManager = CredentialManager.create(this)
        
        // Request location permissions
        locationPermissionRequest.launch(arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ))
        
        setContent {
            AttendanceTrackerTheme {
                AttendanceApp(
                    adMobManager = adMobManager, 
                    activity = this,
                    onGoogleSignIn = { viewModel -> 
                        loginViewModel = viewModel
                        startGoogleSignIn() 
                    }
                )
            }
        }
    }
    
    private fun startGoogleSignIn() {
        val googleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(WEB_CLIENT_ID)
            .setAutoSelectEnabled(false)
            .build()
        
        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()
        
        lifecycleScope.launch {
            try {
                val result = credentialManager.getCredential(
                    request = request,
                    context = this@MainActivity
                )
                handleGoogleSignInResult(result)
            } catch (e: GetCredentialException) {
                Log.e(TAG, "Google Sign-In failed: ${e.message}", e)
                loginViewModel?.onGoogleSignInError("Google Sign-In failed: ${e.message}")
            }
        }
    }
    
    private fun handleGoogleSignInResult(result: GetCredentialResponse) {
        when (val credential = result.credential) {
            is CustomCredential -> {
                if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    try {
                        val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                        val idToken = googleIdTokenCredential.idToken
                        val googleId = googleIdTokenCredential.id
                        val displayName = googleIdTokenCredential.displayName ?: "User"
                        
                        Log.d(TAG, "Google Sign-In successful: $displayName")
                        
                        loginViewModel?.handleGoogleSignInResult(
                            googleId = googleId,
                            email = googleId, // Google ID is usually the email
                            displayName = displayName
                        )
                    } catch (e: GoogleIdTokenParsingException) {
                        Log.e(TAG, "Invalid Google ID token", e)
                        loginViewModel?.onGoogleSignInError("Invalid Google credentials")
                    }
                } else {
                    Log.e(TAG, "Unexpected credential type")
                    loginViewModel?.onGoogleSignInError("Unexpected credential type")
                }
            }
            else -> {
                Log.e(TAG, "Unexpected credential type")
                loginViewModel?.onGoogleSignInError("Unexpected credential type")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AttendanceApp(
    mainViewModel: MainViewModel = hiltViewModel(),
    adMobManager: AdMobManager? = null,
    activity: ComponentActivity? = null,
    onGoogleSignIn: (LoginViewModel) -> Unit = {}
) {
    val navController = rememberNavController()
    val currentUser by mainViewModel.currentUser.collectAsState()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination
    
    val isLoggedIn = currentUser != null
    val isAdmin = currentUser?.role == UserRole.ADMIN
    
    val bottomNavItems = if (isAdmin) adminBottomNavItems else userBottomNavItems
    
    // Track screen changes for interstitial ads
    var screenChangeCount by remember { mutableStateOf(0) }
    
    LaunchedEffect(currentDestination?.route) {
        screenChangeCount++
        // Show interstitial ad every 5 screen changes
        if (screenChangeCount % 5 == 0 && activity != null && adMobManager != null) {
            adMobManager.showInterstitialAd(activity)
        }
    }
    
    Scaffold(
        topBar = {
            if (isLoggedIn && currentDestination?.route != Screen.Login.route) {
                TopAppBar(
                    title = {
                        Text(
                            text = "Attendance Tracker",
                            fontWeight = FontWeight.Bold
                        )
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color(0xFF2563EB),
                        titleContentColor = Color.White,
                        actionIconContentColor = Color.White
                    ),
                    actions = {
                        // Notification Badge
                        IconButton(onClick = {
                            navController.navigate(Screen.Notifications.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }) {
                            Icon(
                                Icons.Filled.Notifications,
                                contentDescription = "Notifications"
                            )
                        }
                        
                        // Logout
                        IconButton(onClick = { mainViewModel.logout() }) {
                            Icon(
                                Icons.Filled.Logout,
                                contentDescription = "Logout"
                            )
                        }
                    }
                )
            }
        },
        bottomBar = {
            if (isLoggedIn && currentDestination?.route != Screen.Login.route) {
                Column {
                    // Banner Ad above bottom navigation
                    BannerAdView(
                        modifier = Modifier.fillMaxWidth()
                    )
                    
                    NavigationBar(
                        containerColor = Color.White,
                        tonalElevation = 8.dp
                    ) {
                        bottomNavItems.forEach { screen ->
                            val selected = currentDestination?.hierarchy?.any { 
                                it.route == screen.route 
                            } == true
                            
                            NavigationBarItem(
                                icon = {
                                    Icon(
                                        imageVector = if (selected) screen.selectedIcon else screen.unselectedIcon,
                                        contentDescription = screen.title
                                    )
                                },
                                label = { 
                                    Text(
                                        text = screen.title,
                                        style = MaterialTheme.typography.labelSmall
                                    ) 
                                },
                                selected = selected,
                                onClick = {
                                    navController.navigate(screen.route) {
                                        popUpTo(navController.graph.findStartDestination().id) {
                                            saveState = true
                                        }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Color(0xFF2563EB),
                                    selectedTextColor = Color(0xFF2563EB),
                                    indicatorColor = Color(0xFFEFF6FF),
                                    unselectedIconColor = Color(0xFF6B7280),
                                    unselectedTextColor = Color(0xFF6B7280)
                                )
                            )
                        }
                    }
                }
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = if (isLoggedIn) Screen.Attendance.route else Screen.Login.route,
            modifier = Modifier.padding(paddingValues)
        ) {
            composable(Screen.Login.route) {
                val loginViewModel: LoginViewModel = hiltViewModel()
                LoginScreen(
                    viewModel = loginViewModel,
                    onLoginSuccess = {
                        navController.navigate(Screen.Attendance.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    },
                    onGoogleSignInClick = {
                        onGoogleSignIn(loginViewModel)
                    }
                )
            }
            
            composable(Screen.Attendance.route) {
                currentUser?.let { user ->
                    AttendanceScreen(
                        userName = user.name,
                        userRole = user.role
                    )
                }
            }
            
            composable(Screen.NightDuty.route) {
                currentUser?.let { user ->
                    NightDutyScreen(
                        userName = user.name,
                        userRole = user.role
                    )
                }
            }
            
            composable(Screen.Leaves.route) {
                currentUser?.let { user ->
                    LeaveScreen(
                        userName = user.name,
                        userRole = user.role
                    )
                }
            }
            
            composable(Screen.Reports.route) {
                currentUser?.let { user ->
                    ReportScreen(
                        userName = user.name,
                        userRole = user.role
                    )
                }
            }
            
            composable(Screen.Notifications.route) {
                currentUser?.let { user ->
                    NotificationScreen(userId = user.id)
                }
            }
            
            composable(Screen.Employees.route) {
                EmployeeScreen()
            }
        }
    }
    
    // Handle logout navigation
    LaunchedEffect(isLoggedIn) {
        if (!isLoggedIn) {
            navController.navigate(Screen.Login.route) {
                popUpTo(0) { inclusive = true }
            }
        }
    }
}
